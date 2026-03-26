import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import fs from 'fs';

export async function GET(req: NextRequest) {
    try {
        fs.appendFileSync('m:/dev/know/tmp/api-log.txt', 'GET /api/settings - START\n');
        const auth = await requireAuth('audit.view');
        if (isAuthError(auth)) {
            fs.appendFileSync('m:/dev/know/tmp/api-log.txt', 'GET /api/settings - AUTH FAIL\n');
            return auth;
        }

        fs.appendFileSync('m:/dev/know/tmp/api-log.txt', 'GET /api/settings - FETCHING...\n');
        const settings = await prisma.systemSetting.findMany();
        fs.appendFileSync('m:/dev/know/tmp/api-log.txt', `GET /api/settings - FOUND ${settings.length}\n`);
        const settingsMap: Record<string, string> = {};
        settings.forEach((s: { key: string, value: string }) => { settingsMap[s.key] = s.value; });

        return NextResponse.json({ 
            auditKeepLatest: settingsMap['audit.keepLatest'] || '1000',
            auditMaxAgeDays: settingsMap['audit.maxAgeDays'] || '90'
        });
    } catch (error: any) {
        fs.appendFileSync('m:/dev/know/tmp/api-log.txt', `GET /api/settings - ERROR: ${error.stack || error}\n`);
        console.error('API SETTINGS GET ERROR:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth('audit.cleanup');
        if (isAuthError(auth)) return auth;

        const body = await req.json();
        const { auditKeepLatest, auditMaxAgeDays } = body;

        const updates = [];
        if (auditKeepLatest !== undefined) {
            updates.push(prisma.systemSetting.upsert({
                where: { key: 'audit.keepLatest' },
                update: { value: String(auditKeepLatest) },
                create: { key: 'audit.keepLatest', value: String(auditKeepLatest) }
            }));
        }
        if (auditMaxAgeDays !== undefined) {
            updates.push(prisma.systemSetting.upsert({
                where: { key: 'audit.maxAgeDays' },
                update: { value: String(auditMaxAgeDays) },
                create: { key: 'audit.maxAgeDays', value: String(auditMaxAgeDays) }
            }));
        }

        await Promise.all(updates);
        return NextResponse.json({ message: 'Global settings updated' });
    } catch (error: any) {
        console.error('API SETTINGS PUT ERROR:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
