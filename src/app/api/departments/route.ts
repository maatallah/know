import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';

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
    const auth = await requireAuth('departments.create');
    if (isAuthError(auth)) return auth;

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
