import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('users.edit');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await req.json();

    const user = await prisma.user.update({
        where: { id },
        data: {
            name: body.name?.trim(),
            role: body.role,
            departmentId: body.departmentId || null,
        },
        select: {
            id: true, name: true, email: true, role: true, createdAt: true,
            department: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(user);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('users.delete');
    if (isAuthError(auth)) return auth;

    const { id } = await params;

    if (id === auth.userId) {
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
