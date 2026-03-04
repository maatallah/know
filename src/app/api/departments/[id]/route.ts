import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('departments.edit');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await req.json();
    if (!body.name || body.name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const dept = await prisma.department.update({
        where: { id },
        data: { name: body.name.trim(), description: body.description?.trim() || null },
        include: { _count: { select: { users: true, machines: true, knowledgeItems: true } } },
    });

    return NextResponse.json(dept);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('departments.delete');
    if (isAuthError(auth)) return auth;

    const { id } = await params;

    const counts = await prisma.department.findUnique({
        where: { id },
        include: { _count: { select: { users: true, machines: true, knowledgeItems: true } } },
    });

    if (counts && (counts._count.users > 0 || counts._count.machines > 0 || counts._count.knowledgeItems > 0)) {
        return NextResponse.json(
            { error: 'Cannot delete department with linked users, machines, or knowledge items' },
            { status: 400 }
        );
    }

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
