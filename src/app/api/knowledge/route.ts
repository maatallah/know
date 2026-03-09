import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import { createKnowledgeSchema, validateRequest } from '@/lib/validations';

// GET /api/knowledge — List knowledge items with filters
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const risk = searchParams.get('risk');
    const criticality = searchParams.get('criticality');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { isDeleted: false };

    if (department) where.departmentId = department;
    if (type) where.type = type;
    if (status) where.status = status;
    if (risk) where.riskLevel = risk;
    if (criticality) where.criticalityLevel = criticality;
    if (tag) where.tags = { some: { id: tag } };
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
    const auth = await requireAuth('knowledge.create');
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validation = validateRequest(createKnowledgeSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const data = validation.data;
    const userId = auth.userId;

    const item = await prisma.knowledgeItem.create({
        data: {
            title: data.title,
            shortDescription: data.shortDescription,
            type: data.type,
            riskLevel: data.riskLevel,
            criticalityLevel: data.criticalityLevel,
            estimatedTimeMin: data.estimatedTimeMin || null,
            requiredTools: data.requiredTools || null,
            preconditions: data.preconditions || null,
            expectedOutcome: data.expectedOutcome || null,
            ownerId: userId,
            departmentId: data.departmentId,
            machineId: data.machineId || null,
            categoryId: data.categoryId || null,
            effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            tags: data.tagIds?.length
                ? { connect: data.tagIds.map((id: string) => ({ id })) }
                : undefined,
            versions: {
                create: {
                    versionNumber: 1,
                    content: data.content,
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
