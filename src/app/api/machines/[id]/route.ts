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
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const linked = await prisma.knowledgeItem.count({ where: { machineId: id } });
    if (linked > 0) {
        return NextResponse.json(
            { error: 'Cannot delete machine with linked knowledge items' },
            { status: 400 }
        );
    }

    await prisma.machine.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
