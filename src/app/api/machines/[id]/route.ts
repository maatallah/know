import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const machine = await prisma.machine.findUnique({
        where: { id },
        include: {
            department: { select: { id: true, name: true } },
            knowledgeItems: {
                where: { isDeleted: false },
                orderBy: { updatedAt: 'desc' },
                include: {
                    owner: { select: { id: true, name: true } },
                    tags: { select: { id: true, name: true } },
                },
            },
        },
    });

    if (!machine) {
        return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('machines.edit');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await req.json();

    const machine = await prisma.machine.update({
        where: { id },
        data: {
            name: body.name?.trim(),
            serialNumber: body.serialNumber?.trim() || null,
            departmentId: body.departmentId,
        },
        include: { department: { select: { id: true, name: true } } },
    });

    return NextResponse.json(machine);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('machines.delete');
    if (isAuthError(auth)) return auth;

    const { id } = await params;

    const linked = await prisma.knowledgeItem.count({ where: { machineId: id, isDeleted: false } });
    if (linked > 0) {
        return NextResponse.json(
            { error: `Cannot delete: ${linked} knowledge item(s) are still linked to this machine` },
            { status: 400 }
        );
    }

    await prisma.machine.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
