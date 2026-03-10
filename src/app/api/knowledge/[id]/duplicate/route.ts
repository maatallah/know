import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    try {
        // Fetch original item with its tags and latest content
        const original = await prisma.knowledgeItem.findUnique({
            where: { id },
            include: {
                tags: { select: { id: true } },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!original) {
            return NextResponse.json({ error: 'Original item not found' }, { status: 404 });
        }

        const latestContent = original.versions.length > 0 ? original.versions[0].content : '';

        // Create the duplicate
        const duplicate = await prisma.knowledgeItem.create({
            data: {
                title: `${original.title} (Copy)`,
                shortDescription: original.shortDescription,
                type: original.type,
                riskLevel: original.riskLevel,
                criticalityLevel: original.criticalityLevel,
                estimatedTimeMin: original.estimatedTimeMin,
                requiredTools: original.requiredTools,
                preconditions: original.preconditions,
                expectedOutcome: original.expectedOutcome,

                ownerId: userId,
                departmentId: original.departmentId,
                machineId: original.machineId,
                categoryId: original.categoryId,

                tags: original.tags.length > 0
                    ? { connect: original.tags.map(t => ({ id: t.id })) }
                    : undefined,

                versions: {
                    create: {
                        versionNumber: 1,
                        content: latestContent,
                        authorId: userId,
                        status: 'DRAFT',
                    }
                }
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entityType: 'KnowledgeItem',
                entityId: duplicate.id,
                userId,
                details: { duplicatedFrom: original.id }
            }
        });

        return NextResponse.json(duplicate, { status: 201 });

    } catch (error) {
        console.error('Failed to duplicate item:', error);
        return NextResponse.json({ error: 'Internal server error while duplicating' }, { status: 500 });
    }
}
