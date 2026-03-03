import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const entries = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            user: { select: { id: true, name: true } },
        },
    });
    return NextResponse.json(entries);
}
