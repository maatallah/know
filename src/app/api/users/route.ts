import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            department: { select: { name: true } },
        },
    });
    return NextResponse.json(users);
}
