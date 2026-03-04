import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import bcrypt from 'bcryptjs';

export async function GET() {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true, name: true, email: true, role: true, createdAt: true,
            department: { select: { id: true, name: true } },
        },
    });
    return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth('users.create');
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    if (!body.email || !body.name) {
        return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password || 'password123', 12);

    const user = await prisma.user.create({
        data: {
            email: body.email.trim().toLowerCase(),
            name: body.name.trim(),
            passwordHash,
            role: body.role || 'STANDARD_USER',
            departmentId: body.departmentId || null,
        },
        select: {
            id: true, name: true, email: true, role: true, createdAt: true,
            department: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(user, { status: 201 });
}
