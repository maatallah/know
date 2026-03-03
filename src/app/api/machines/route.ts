import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const machines = await prisma.machine.findMany({
        orderBy: { name: 'asc' },
        include: { department: { select: { id: true, name: true } } },
    });
    return NextResponse.json(machines);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.name || body.name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }
    if (!body.departmentId) {
        return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }

    const machine = await prisma.machine.create({
        data: {
            name: body.name.trim(),
            serialNumber: body.serialNumber?.trim() || null,
            departmentId: body.departmentId,
        },
        include: { department: { select: { id: true, name: true } } },
    });

    return NextResponse.json(machine, { status: 201 });
}
