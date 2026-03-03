import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/knowledge/[id] — Get single knowledge item with details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const item = await prisma.knowledgeItem.findUnique({
        where: { id, isDeleted: false },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } },
            machine: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            tags: { select: { id: true, name: true } },
            versions: {
                orderBy: { versionNumber: 'desc' },
                include: { author: { select: { id: true, name: true } } },
            },
            comments: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true } } },
            },
            attachments: true,
        },
    });

    if (!item) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.knowledgeItem.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(item);
}

// PUT /api/knowledge/[id] — Update a knowledge item (only if DRAFT)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const userId = (session.user as { id: string }).id;

    const existing = await prisma.knowledgeItem.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing.status === 'APPROVED') {
        return NextResponse.json(
            { error: 'Cannot edit an approved item. Create a new version instead.' },
            { status: 403 }
        );
    }

    const item = await prisma.knowledgeItem.update({
        where: { id },
        data: {
            title: body.title,
            shortDescription: body.shortDescription,
            type: body.type,
            riskLevel: body.riskLevel,
            criticalityLevel: body.criticalityLevel,
            estimatedTimeMin: body.estimatedTimeMin || null,
            requiredTools: body.requiredTools || null,
            preconditions: body.preconditions || null,
            expectedOutcome: body.expectedOutcome || null,
            departmentId: body.departmentId,
            machineId: body.machineId || null,
            categoryId: body.categoryId || null,
            effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        },
    });

    // Update the latest version content
    if (body.content !== undefined) {
        const latestVersion = await prisma.knowledgeVersion.findFirst({
            where: { knowledgeItemId: id },
            orderBy: { versionNumber: 'desc' },
        });
        if (latestVersion && latestVersion.status === 'DRAFT') {
            await prisma.knowledgeVersion.update({
                where: { id: latestVersion.id },
                data: { content: body.content },
            });
        }
    }

    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entityType: 'KnowledgeItem',
            entityId: id,
            userId,
        },
    });

    return NextResponse.json(item);
}

// DELETE /api/knowledge/[id] — Soft delete
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;

    await prisma.knowledgeItem.update({
        where: { id },
        data: { isDeleted: true },
    });

    await prisma.auditLog.create({
        data: {
            action: 'DELETE',
            entityType: 'KnowledgeItem',
            entityId: id,
            userId,
        },
    });

    return NextResponse.json({ success: true });
}
