import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError } from '@/lib/rbac';
import { updateGapStatusSchema, validateRequest } from '@/lib/validations';
import { sendNotification } from '@/lib/notifications';
import { getTranslations } from 'next-intl/server';

// GET — Get single gap request
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const gap = await prisma.knowledgeGapRequest.findUnique({
        where: { id },
        include: {
            reporter: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, email: true, locale: true } },
            linkedItem: { select: { id: true, title: true } },
        },
    });

    if (!gap) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
        ...gap,
        submittedBy: gap.reporter,
        assignedTo: gap.assignee,
    });
}

// PUT — Update gap status (assign, close, link)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth('gaps.edit');
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await req.json();
    const validation = validateRequest(updateGapStatusSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { status, assigneeId, linkedItemId, rejectReason } = validation.data;
    const userId = auth.userId;

    if (status === 'CLOSED') {
        const currentGap = await prisma.knowledgeGapRequest.findUnique({ where: { id } });
        if (!currentGap) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        const finalLinkedItemId = linkedItemId !== undefined ? linkedItemId : currentGap.linkedItemId;
        if (!finalLinkedItemId && (!rejectReason || rejectReason.trim().length === 0)) {
            return NextResponse.json({ error: 'A closed gap must be fulfilled (linked) or explicitly rejected with a reason.' }, { status: 400 });
        }
    }

    const gap = await prisma.knowledgeGapRequest.update({
        where: { id },
        data: {
            status,
            assigneeId: assigneeId || undefined,
            linkedItemId: linkedItemId || undefined,
            rejectReason: rejectReason || undefined,
        },
        include: {
            reporter: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true, email: true, locale: true } },
            linkedItem: { select: { id: true, title: true } },
        },
    });

    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entityType: 'KnowledgeGapRequest',
            entityId: id,
            userId,
            details: { status, assigneeId, linkedItemId, rejectReason },
        },
    });

    // Send notification if assigned
    if (status === 'ASSIGNED' && gap.assignee && gap.assignee.email) {
        const locale = gap.assignee.locale || 'en';
        const tNotify = await getTranslations({ locale, namespace: 'notifications' });

        await sendNotification({
            to: gap.assignee.email,
            subject: tNotify('gapAssignedSubject', { title: gap.title }),
            message: tNotify('gapAssignedMessage', { title: gap.title })
        });
    }

    return NextResponse.json({
        ...gap,
        submittedBy: gap.reporter,
        assignedTo: gap.assignee,
    });
}
