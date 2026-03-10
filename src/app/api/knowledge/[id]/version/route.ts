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
        const item = await prisma.knowledgeItem.findUnique({
            where: { id },
            include: {
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.status !== 'APPROVED' && item.status !== 'ARCHIVED') {
            return NextResponse.json({
                error: 'Can only create new versions for APPROVED or ARCHIVED items'
            }, { status: 400 });
        }

        const currentLatestVersion = item.versions[0];
        const nextVersionNum = currentLatestVersion ? currentLatestVersion.versionNumber + 1 : 1;
        const currentContent = currentLatestVersion ? currentLatestVersion.content : '';

        // Spawn a new Draft version
        await prisma.knowledgeVersion.create({
            data: {
                knowledgeItemId: id,
                versionNumber: nextVersionNum,
                content: currentContent,
                authorId: userId,
                status: 'DRAFT'
            }
        });

        // Downgrade the item's overarching status back to DRAFT so it can enter the workflow
        const updatedItem = await prisma.knowledgeItem.update({
            where: { id },
            data: { status: 'DRAFT' }
        });

        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entityType: 'KnowledgeItem',
                entityId: id,
                userId,
                details: { event: 'CREATED_NEW_VERSION', newVersionNumber: nextVersionNum }
            }
        });

        return NextResponse.json(updatedItem);

    } catch (error) {
        console.error('Failed to create new version:', error);
        return NextResponse.json({ error: 'Internal server error while creating new version' }, { status: 500 });
    }
}
