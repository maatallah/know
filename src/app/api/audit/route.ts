import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const auth = await requireAuth('audit.view');
    if (isAuthError(auth)) return auth;

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;
    const action = searchParams.get('action') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const whereClause: any = {};
    if (action) whereClause.action = action;
    if (from || to) {
        whereClause.createdAt = {};
        if (from) whereClause.createdAt.gte = new Date(from);
        if (to) whereClause.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.auditLog.count({ where: whereClause }),
    ]);

    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAuth('audit.cleanup'); // SUPER_ADMIN only
    if (isAuthError(auth)) return auth;

    const searchParams = req.nextUrl.searchParams;
    
    // Fetch global settings defaults
    const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ['audit.maxAgeDays', 'audit.keepLatest'] } }
    });
    const settingsMap = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

    const maxAgeDays = parseInt(searchParams.get('maxAgeDays') || settingsMap['audit.maxAgeDays'] || '90');
    const keepOnlyLatest = parseInt(searchParams.get('keepOnlyLatest') || settingsMap['audit.keepLatest'] || '1000');

    try {
        const now = new Date();
        const logsToPrune: string[] = [];
        
        // 1. Find logs older than maxAgeDays
        if (maxAgeDays > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
            
            const oldLogs = await prisma.auditLog.findMany({
                where: { createdAt: { lt: cutoffDate } },
                select: { id: true }
            });
            oldLogs.forEach((l: { id: string }) => logsToPrune.push(l.id));
        }

        // 2. Find logs exceeding count limit (excluding those already found by age)
        if (keepOnlyLatest > 0) {
            const totalCount = await prisma.auditLog.count();
            if (totalCount > keepOnlyLatest) {
                // Get oldest logs that aren't already in the list
                const excessLogs = await prisma.auditLog.findMany({
                    where: { id: { notIn: logsToPrune } },
                    orderBy: { createdAt: 'asc' },
                    take: Math.max(0, totalCount - keepOnlyLatest - logsToPrune.length),
                    select: { id: true }
                });
                excessLogs.forEach((l: { id: string }) => logsToPrune.push(l.id));
            }
        }

        if (logsToPrune.length === 0) {
            return NextResponse.json({ message: 'No logs to prune based on criteria', deletedCount: 0 });
        }

        // 3. ARCHIVING: Fetch full details for the identified logs
        const fullLogsToPrune = await prisma.auditLog.findMany({
            where: { id: { in: logsToPrune } },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const archiveDir = path.join(process.cwd(), 'public', 'archives', 'audit');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `audit_archive_${timestamp}.json`;
        const filePath = path.join(archiveDir, fileName);
        
        // Write to file
        fs.writeFileSync(filePath, JSON.stringify(fullLogsToPrune, null, 2));

        // 4. DELETION: Only delete from DB if file write was successful
        const deleteResult = await prisma.auditLog.deleteMany({
            where: { id: { in: logsToPrune } }
        });

        return NextResponse.json({ 
            message: `Cleanup successful. ${deleteResult.count} logs archived and deleted.`,
            deletedCount: deleteResult.count,
            archiveFile: fileName,
            archivePath: filePath
        });

    } catch (error: any) {
        console.error('Audit cleanup error:', error);
        return NextResponse.json({ error: 'Archiving/Cleanup failed', details: error.message }, { status: 500 });
    }
}
