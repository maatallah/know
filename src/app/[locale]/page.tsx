'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import {
    BookOpen,
    Clock,
    CheckCircle2,
    Archive,
    FileEdit,
    AlertTriangle,
    Eye,
    Users,
    TrendingUp,
} from 'lucide-react';

interface DashboardData {
    totalItems: number;
    inReview: number;
    approved: number;
    archived: number;
    drafts: number;
    expiredItems: number;
    nearExpiry: number;
    openGaps: number;
    byDepartment: { id: string; name: string; count: number }[];
    byType: { type: string; count: number }[];
    mostViewed: { id: string; title: string; viewCount: number; type: string; status: string }[];
    topContributors: { id: string; name: string | null; role: string; itemCount: number }[];
}

const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const tk = useTranslations('knowledge');
    const tc = useTranslations('common');
    const tu = useTranslations('users');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then((r) => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

            {/* Status Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<BookOpen className="h-5 w-5" />} label={t('totalItems')} value={data.totalItems} color="text-primary" />
                <StatCard icon={<Clock className="h-5 w-5" />} label={t('inReview')} value={data.inReview} color="text-blue-600" />
                <StatCard icon={<AlertTriangle className="h-5 w-5" />} label={t('expiredItems')} value={data.expiredItems} color="text-red-600" />
                <StatCard icon={<TrendingUp className="h-5 w-5" />} label={t('gapsSubmitted')} value={data.openGaps} color="text-orange-600" />
            </div>

            {/* Status Breakdown */}
            <div className="grid gap-4 sm:grid-cols-4">
                <MiniCard label={t('drafts')} value={data.drafts} icon={<FileEdit className="h-4 w-4" />} />
                <MiniCard label={t('inReview')} value={data.inReview} icon={<Clock className="h-4 w-4" />} />
                <MiniCard label={t('approved')} value={data.approved} icon={<CheckCircle2 className="h-4 w-4" />} />
                <MiniCard label={t('archived')} value={data.archived} icon={<Archive className="h-4 w-4" />} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Items by Department */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">{t('itemsByDepartment')}</h2>
                    {data.byDepartment.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tc('noResults')}</p>
                    ) : (
                        <div className="space-y-3">
                            {data.byDepartment.map((dept) => (
                                <div key={dept.id} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{dept.name}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${data.totalItems ? (dept.count / data.totalItems) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold w-8 text-end">{dept.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Most Viewed */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">{t('mostViewed')}</h2>
                    {data.mostViewed.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tc('noResults')}</p>
                    ) : (
                        <div className="space-y-3">
                            {data.mostViewed.map((item, i) => (
                                <Link
                                    key={item.id}
                                    href={`/knowledge/${item.id}`}
                                    className="flex items-center justify-between rounded-lg p-2 hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                                        <div>
                                            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                            <span className={cn('text-xs rounded-full px-2 py-0.5', statusColors[item.status])}>
                                                {tk(`statuses.${item.status}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Eye className="h-3.5 w-3.5" />
                                        {item.viewCount}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Contributors */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">{t('contributionStats')}</h2>
                    {data.topContributors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tc('noResults')}</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topContributors.map((user) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                            {(user.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{tu(`roles.${user.role}`)}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold">{user.itemCount}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Near Expiry Alert */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">{t('nearExpiry')}</h2>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold',
                            data.nearExpiry > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                        )}>
                            {data.nearExpiry}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {data.nearExpiry === 0
                                ? t('noExpiringSoon')
                                : t('expiringSoon', { count: data.nearExpiry })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className={cn('flex items-center gap-2 mb-2', color)}>
                {icon}
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}

function MiniCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{value}</p>
            </div>
        </div>
    );
}
