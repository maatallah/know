import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { users: true, machines: true, knowledgeItems: true } },
        },
    });
    return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || body.name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const dept = await prisma.department.create({
        data: { name: body.name.trim(), description: body.description?.trim() || null },
        include: { _count: { select: { users: true, machines: true, knowledgeItems: true } } },
    });

    return NextResponse.json(dept, { status: 201 });
}
