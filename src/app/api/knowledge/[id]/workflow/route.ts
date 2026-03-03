import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workflowActionSchema, validateRequest } from '@/lib/validations';

// POST /api/knowledge/[id]/workflow — Handle workflow transitions
// body: { action: 'submit-review' | 'approve' | 'archive', comment?: string }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = validateRequest(workflowActionSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors.flatten().fieldErrors },
            { status: 400 }
        );
    }
    const { action, comment } = validation.data;
    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;

    const item = await prisma.knowledgeItem.findUnique({
        where: { id },
        include: {
            versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
    });

    if (!item) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Workflow state machine
    if (action === 'submit-review') {
        if (item.status !== 'DRAFT') {
            return NextResponse.json(
                { error: 'Only DRAFT items can be submitted for review' },
                { status: 400 }
            );
        }

        await prisma.$transaction([
            prisma.knowledgeItem.update({
                where: { id },
                data: { status: 'IN_REVIEW' },
            }),
            prisma.knowledgeVersion.update({
                where: { id: item.versions[0]?.id },
                data: { status: 'IN_REVIEW' },
            }),
            prisma.auditLog.create({
                data: {
                    action: 'SUBMIT_REVIEW',
                    entityType: 'KnowledgeItem',
                    entityId: id,
                    userId,
                    details: { comment: comment || null },
                },
            }),
        ]);
    } else if (action === 'approve') {
        if (item.status !== 'IN_REVIEW') {
            return NextResponse.json(
                { error: 'Only IN_REVIEW items can be approved' },
                { status: 400 }
            );
        }
        if (!['SUPER_ADMIN', 'REVIEWER', 'DEPARTMENT_MANAGER'].includes(userRole)) {
            return NextResponse.json(
                { error: 'Only reviewers can approve items' },
                { status: 403 }
            );
        }
        // Zod already enforces mandatory comment for approve action

        // Create snapshot of the item metadata at approval time
        const snapshot = {
            title: item.title,
            type: item.type,
            riskLevel: item.riskLevel,
            criticalityLevel: item.criticalityLevel,
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            approvedBy: userId,
        };

        await prisma.$transaction([
            prisma.knowledgeItem.update({
                where: { id },
                data: { status: 'APPROVED' },
            }),
            prisma.knowledgeVersion.update({
                where: { id: item.versions[0]?.id },
                data: {
                    status: 'APPROVED',
                    reviewerId: userId,
                    approvalComment: comment!,
                    snapshot,
                },
            }),
            prisma.auditLog.create({
                data: {
                    action: 'APPROVAL',
                    entityType: 'KnowledgeItem',
                    entityId: id,
                    userId,
                    details: { comment },
                },
            }),
        ]);
    } else if (action === 'archive') {
        if (item.status !== 'APPROVED') {
            return NextResponse.json(
                { error: 'Only APPROVED items can be archived' },
                { status: 400 }
            );
        }

        await prisma.$transaction([
            prisma.knowledgeItem.update({
                where: { id },
                data: { status: 'ARCHIVED' },
            }),
            prisma.knowledgeVersion.update({
                where: { id: item.versions[0]?.id },
                data: { status: 'ARCHIVED' },
            }),
            prisma.auditLog.create({
                data: {
                    action: 'ARCHIVE',
                    entityType: 'KnowledgeItem',
                    entityId: id,
                    userId,
                },
            }),
        ]);
    } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.knowledgeItem.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(updated);
}
