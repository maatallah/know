import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

// GET /api/me — Return current user info and permissions
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = session.user as unknown as { id: string; role: string; name?: string; email?: string };

    // Build a permissions map for the frontend
    const allPermissions: Permission[] = [
        'users.create', 'users.edit', 'users.delete',
        'departments.create', 'departments.edit', 'departments.delete',
        'machines.create', 'machines.edit', 'machines.delete',
        'knowledge.create', 'knowledge.edit', 'knowledge.delete', 'knowledge.workflow',
        'gaps.create', 'gaps.edit',
        'attachments.upload', 'attachments.delete',
        'audit.view', 'audit.cleanup',
    ];

    const permissions: Record<string, boolean> = {};
    for (const perm of allPermissions) {
        permissions[perm] = hasPermission(user.role, perm);
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { theme: true, locale: true, department: { select: { name: true } } }
    });

    return NextResponse.json({
        authenticated: true,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: dbUser?.department?.name,
        theme: dbUser?.theme || 'system',
        locale: dbUser?.locale || 'en',
        permissions,
    });
}
