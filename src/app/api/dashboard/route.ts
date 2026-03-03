import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const [
        totalItems,
        inReview,
        approved,
        archived,
        drafts,
        expiredItems,
        byDepartment,
        byType,
        mostViewed,
        recentGaps,
        topContributors,
    ] = await Promise.all([
        // Total active items
        prisma.knowledgeItem.count({ where: { isDeleted: false } }),

        // In review
        prisma.knowledgeItem.count({ where: { status: 'IN_REVIEW', isDeleted: false } }),

        // Approved
        prisma.knowledgeItem.count({ where: { status: 'APPROVED', isDeleted: false } }),

        // Archived
        prisma.knowledgeItem.count({ where: { status: 'ARCHIVED', isDeleted: false } }),

        // Drafts
        prisma.knowledgeItem.count({ where: { status: 'DRAFT', isDeleted: false } }),

        // Expired items
        prisma.knowledgeItem.count({
            where: {
                isDeleted: false,
                expiryDate: { lt: new Date() },
            },
        }),

        // Items by department
        prisma.department.findMany({
            select: {
                id: true,
                name: true,
                _count: { select: { knowledgeItems: true } },
            },
            orderBy: { name: 'asc' },
        }),

        // Items by type
        prisma.knowledgeItem.groupBy({
            by: ['type'],
            _count: { type: true },
            where: { isDeleted: false },
        }),

        // Most viewed (top 5)
        prisma.knowledgeItem.findMany({
            where: { isDeleted: false },
            orderBy: { viewCount: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                viewCount: true,
                type: true,
                status: true,
            },
        }),

        // Recent knowledge gaps
        prisma.knowledgeGapRequest.count({ where: { status: 'OPEN' } }),

        // Top contributors
        prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true,
                _count: { select: { ownedItems: true } },
            },
            orderBy: { ownedItems: { _count: 'desc' } },
            take: 5,
        }),
    ]);

    // Near-expiry (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const nearExpiry = await prisma.knowledgeItem.count({
        where: {
            isDeleted: false,
            expiryDate: {
                gt: new Date(),
                lt: thirtyDaysFromNow,
            },
        },
    });

    return NextResponse.json({
        totalItems,
        inReview,
        approved,
        archived,
        drafts,
        expiredItems,
        nearExpiry,
        openGaps: recentGaps,
        byDepartment: byDepartment.map((d) => ({
            id: d.id,
            name: d.name,
            count: d._count.knowledgeItems,
        })),
        byType: byType.map((t) => ({
            type: t.type,
            count: t._count.type,
        })),
        mostViewed,
        topContributors: topContributors.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            itemCount: u._count.ownedItems,
        })),
    });
}
