import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/knowledge — List knowledge items with filters
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const risk = searchParams.get('risk');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { isDeleted: false };

    if (department) where.departmentId = department;
    if (type) where.type = type;
    if (status) where.status = status;
    if (risk) where.riskLevel = risk;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { shortDescription: { contains: search, mode: 'insensitive' } },
        ];
    }

    const orderBy: Record<string, string> =
        sort === 'views'
            ? { viewCount: 'desc' }
            : sort === 'alpha'
                ? { title: 'asc' }
                : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
        prisma.knowledgeItem.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                owner: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, name: true } },
                machine: { select: { id: true, name: true } },
                tags: { select: { id: true, name: true } },
                _count: { select: { versions: true, comments: true } },
            },
        }),
        prisma.knowledgeItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
}

// POST /api/knowledge — Create a new knowledge item
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const userId = (session.user as { id: string }).id;

    const item = await prisma.knowledgeItem.create({
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
            ownerId: userId,
            departmentId: body.departmentId,
            machineId: body.machineId || null,
            categoryId: body.categoryId || null,
            effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
            tags: body.tagIds?.length
                ? { connect: body.tagIds.map((id: string) => ({ id })) }
                : undefined,
            versions: {
                create: {
                    versionNumber: 1,
                    content: body.content || '',
                    authorId: userId,
                    status: 'DRAFT',
                },
            },
        },
        include: {
            owner: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            versions: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entityType: 'KnowledgeItem',
            entityId: item.id,
            userId,
        },
    });

    return NextResponse.json(item, { status: 201 });
}
