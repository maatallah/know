import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import { z } from 'zod';
import { validateRequest } from '@/lib/validations';

const tagSchema = z.object({
    name: z.string().min(2).max(50),
});

export async function GET() {
    const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
    });
    return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth('knowledge.create'); // Base permission to create a tag
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validation = validateRequest(tagSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors.flatten().fieldErrors },
            { status: 400 }
        );
    }

    try {
        const tag = await prisma.tag.create({
            data: { name: validation.data.name },
        });
        return NextResponse.json(tag);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
