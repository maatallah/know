import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    locale: z.enum(['en', 'fr', 'ar']).optional(),
});

export async function PUT(req: NextRequest) {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    try {
        const body = await req.json();
        const parsed = updateProfileSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (parsed.data.name !== undefined) dataToUpdate.name = parsed.data.name;
        if (parsed.data.theme !== undefined) dataToUpdate.theme = parsed.data.theme;
        if (parsed.data.locale !== undefined) dataToUpdate.locale = parsed.data.locale;

        const updatedUser = await prisma.user.update({
            where: { id: auth.userId },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, role: true, departmentId: true, theme: true, locale: true },
        });

        return NextResponse.json(updatedUser);
    } catch (e: any) {
        console.error('Update Profile Error Details:', e);
        if (e instanceof Error) {
            console.error('Error name:', e.name, 'Message:', e.message);
        }
        return NextResponse.json({ error: 'Failed to update profile', details: e.message || String(e) }, { status: 500 });
    }
}
