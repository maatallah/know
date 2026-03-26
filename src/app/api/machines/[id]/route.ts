import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const machine = await prisma.machine.findUnique({
        where: { id },
        include: {
            department: { select: { id: true, name: true } },
            knowledgeItems: {
                where: { isDeleted: false },
                orderBy: { updatedAt: 'desc' },
                include: {
                    owner: { select: { id: true, name: true } },
                    tags: { select: { id: true, name: true } },
                },
            },
        },
    });

    if (!machine) {
        return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('machines.edit');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await req.json();

    const machine = await prisma.machine.update({
        where: { id },
        data: {
            name: body.name?.trim(),
            serialNumber: body.serialNumber?.trim() || null,
            departmentId: body.departmentId,
        },
        include: { department: { select: { id: true, name: true } } },
    });

    return NextResponse.json(machine);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('machines.delete');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const { userId, userRole } = auth;

    try {
        // 1. Fetch machine to check department and existence
        const machine = await prisma.machine.findUnique({
            where: { id },
            select: { id: true, departmentId: true }
        });

        if (!machine) {
            return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
        }

        // 2. Department-level check for Managers
        if (userRole === 'DEPARTMENT_MANAGER') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { departmentId: true }
            });
            if (user?.departmentId !== machine.departmentId) {
                return NextResponse.json(
                    { error: 'Forbidden — You can only delete machines within your own department' },
                    { status: 403 }
                );
            }
        }

        // 3. Check for ACTIVE knowledge items (these block deletion)
        const activeLinked = await prisma.knowledgeItem.count({
            where: { machineId: id, isDeleted: false }
        });

        if (activeLinked > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${activeLinked} active knowledge item(s) are still linked to this machine. Please delete or reassign them first.` },
                { status: 400 }
            );
        }

        // 4. Handle SOFT-DELETED items: Disconnect them
        await prisma.$transaction([
            prisma.knowledgeItem.updateMany({
                where: { machineId: id, isDeleted: true },
                data: { machineId: null }
            }),
            prisma.machine.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Machine Error:', error);
        
        // Handle specific Prisma errors
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'Cannot delete: This machine is still referenced by other records (Foreign Key constraint).' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error?.message || 'A database error occurred during deletion' },
            { status: 500 }
        );
    }
}
