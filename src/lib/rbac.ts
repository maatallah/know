import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Role hierarchy (higher = more permissions):
 * SUPER_ADMIN > DEPARTMENT_MANAGER > EXPERT > REVIEWER > STANDARD_USER
 */

export type Role = 'SUPER_ADMIN' | 'DEPARTMENT_MANAGER' | 'EXPERT' | 'REVIEWER' | 'STANDARD_USER';

const ROLE_LEVEL: Record<Role, number> = {
    SUPER_ADMIN: 100,
    DEPARTMENT_MANAGER: 80,
    EXPERT: 60,
    REVIEWER: 40,
    STANDARD_USER: 20,
};

// ============================================
// Permission matrix: action → minimum role required
// ============================================
const PERMISSIONS = {
    // Users
    'users.create': 'SUPER_ADMIN',
    'users.edit': 'SUPER_ADMIN',
    'users.delete': 'SUPER_ADMIN',

    // Departments
    'departments.create': 'DEPARTMENT_MANAGER',
    'departments.edit': 'DEPARTMENT_MANAGER',
    'departments.delete': 'SUPER_ADMIN',

    // Machines
    'machines.create': 'DEPARTMENT_MANAGER',
    'machines.edit': 'DEPARTMENT_MANAGER',
    'machines.delete': 'DEPARTMENT_MANAGER',

    // Knowledge items
    'knowledge.create': 'EXPERT',
    'knowledge.edit': 'EXPERT',
    'knowledge.delete': 'DEPARTMENT_MANAGER',
    'knowledge.workflow': 'REVIEWER',

    // Gaps
    'gaps.create': 'STANDARD_USER',
    'gaps.edit': 'DEPARTMENT_MANAGER',

    // Attachments
    'attachments.upload': 'EXPERT',
    'attachments.delete': 'DEPARTMENT_MANAGER',
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a given permission.
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
    const requiredRole = PERMISSIONS[permission] as Role;
    const userLevel = ROLE_LEVEL[userRole as Role] ?? 0;
    const requiredLevel = ROLE_LEVEL[requiredRole] ?? 999;
    return userLevel >= requiredLevel;
}

/**
 * Get session + enforce authentication and optional permission check.
 * Returns { session, userId, userRole } or a NextResponse error.
 */
export async function requireAuth(permission?: Permission): Promise<
    | { session: { user: { id: string; role: string; name?: string; email?: string } }; userId: string; userRole: string }
    | NextResponse
> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
    }

    const user = session.user as unknown as { id: string; role: string; name?: string; email?: string };
    const userId = user.id;
    const userRole = user.role || 'STANDARD_USER';

    if (permission && !hasPermission(userRole, permission)) {
        return NextResponse.json(
            { error: `Forbidden — requires ${PERMISSIONS[permission]} role or higher` },
            { status: 403 }
        );
    }

    return { session: { user }, userId, userRole };
}

/**
 * Type guard to check if requireAuth returned an error response.
 */
export function isAuthError(result: Awaited<ReturnType<typeof requireAuth>>): result is NextResponse {
    return result instanceof NextResponse;
}
