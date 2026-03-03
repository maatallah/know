import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateGapStatusSchema, validateRequest } from '@/lib/validations';

// GET — Get single gap request
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const gap = await prisma.knowledgeGapRequest.findUnique({
        where: { id },
        include: {
            reporter: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
            linkedItem: { select: { id: true, title: true } },
        },
    });

    if (!gap) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
        ...gap,
        submittedBy: gap.reporter,
        assignedTo: gap.assignee,
    });
}

// PUT — Update gap status (assign, close, link)
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
    const validation = validateRequest(updateGapStatusSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { status, assigneeId, linkedItemId } = validation.data;
    const userId = (session.user as { id: string }).id;

    const gap = await prisma.knowledgeGapRequest.update({
        where: { id },
        data: {
            status,
            assigneeId: assigneeId || undefined,
            linkedItemId: linkedItemId || undefined,
        },
        include: {
            reporter: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
            linkedItem: { select: { id: true, title: true } },
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entityType: 'KnowledgeGapRequest',
            entityId: id,
            userId,
            details: { status, assigneeId, linkedItemId },
        },
    });

    return NextResponse.json({
        ...gap,
        submittedBy: gap.reporter,
        assignedTo: gap.assignee,
    });
}
