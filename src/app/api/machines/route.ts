import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const machines = await prisma.machine.findMany({
        orderBy: { name: 'asc' },
        include: { department: { select: { name: true } } },
    });
    return NextResponse.json(machines);
}
