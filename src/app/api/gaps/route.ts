import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGapRequestSchema, validateRequest } from '@/lib/validations';

// GET — List all gap requests
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const gaps = await prisma.knowledgeGapRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            reporter: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
            linkedItem: { select: { id: true, title: true } },
        },
    });

    // Map to consistent API shape
    return NextResponse.json(gaps.map((g) => ({
        ...g,
        submittedBy: g.reporter,
        assignedTo: g.assignee,
    })));
}

// POST — Submit a new gap request
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateRequest(createGapRequestSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const userId = (session.user as { id: string }).id;

    const gap = await prisma.knowledgeGapRequest.create({
        data: {
            title: validation.data.title,
            description: validation.data.description,
            reporterId: userId,
        },
        include: {
            reporter: { select: { id: true, name: true } },
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entityType: 'KnowledgeGapRequest',
            entityId: gap.id,
            userId,
        },
    });

    return NextResponse.json({ ...gap, submittedBy: gap.reporter }, { status: 201 });
}
