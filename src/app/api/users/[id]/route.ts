import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            department: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(user);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Don't allow self-deletion
    const currentUserId = (session.user as unknown as { id: string }).id;
    if (id === currentUserId) {
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
