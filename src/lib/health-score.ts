/**
 * Calculate a health score (0-100) for a knowledge item.
 * Based on: last update age, approval age, view count, comment count, expiry proximity.
 */
export function calculateHealthScore({
    updatedAt,
    status,
    viewCount,
    commentCount,
    expiryDate,
}: {
    updatedAt: Date;
    status: string;
    viewCount: number;
    commentCount: number;
    expiryDate: Date | null;
}): number {
    let score = 100;
    const now = new Date();

    // Freshness penalty: -1 per week since last update (max -30)
    const weeksSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
    score -= Math.min(weeksSinceUpdate, 30);

    // Status penalty
    if (status === 'DRAFT') score -= 20;
    else if (status === 'ARCHIVED') score -= 15;

    // Low engagement penalty
    if (viewCount < 5) score -= 10;
    if (commentCount === 0) score -= 5;

    // Expiry proximity penalty
    if (expiryDate) {
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (daysUntilExpiry < 0) {
            score -= 25; // Expired
        } else if (daysUntilExpiry < 30) {
            score -= 15; // Near expiry
        } else if (daysUntilExpiry < 90) {
            score -= 5;
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Get the health label and color for a given score.
 */
export function getHealthIndicator(score: number): {
    label: string;
    color: string;
    bgColor: string;
} {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
    if (score >= 20) return { label: 'Poor', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' };
}
