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
        <div className="space-y-6 max-w-[1400px] mx-auto pb-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-foreground/90">{t('title')}</h1>
            </div>

            {/* Status Overview Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<BookOpen className="h-4 w-4" />}
                    label={t('totalItems')}
                    value={data.totalItems}
                    gradient="from-blue-500/10 to-transparent"
                    borderColor="border-blue-500/20"
                    textColor="text-blue-500"
                />
                <StatCard
                    icon={<Clock className="h-4 w-4" />}
                    label={t('inReview')}
                    value={data.inReview}
                    gradient="from-amber-500/10 to-transparent"
                    borderColor="border-amber-500/20"
                    textColor="text-amber-500"
                />
                <StatCard
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label={t('expiredItems')}
                    value={data.expiredItems}
                    gradient="from-red-500/10 to-transparent"
                    borderColor="border-red-500/20"
                    textColor="text-red-500"
                />
                <StatCard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label={t('gapsSubmitted')}
                    value={data.openGaps}
                    gradient="from-emerald-500/10 to-transparent"
                    borderColor="border-emerald-500/20"
                    textColor="text-emerald-500"
                />
            </div>

            {/* Secondary Stats Grouped */}
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 grid gap-4 grid-cols-2 md:grid-cols-4">
                <MiniCard label={t('drafts')} value={data.drafts} icon={<FileEdit className="h-3.5 w-3.5" />} color="text-slate-400" />
                <MiniCard label={t('inReview')} value={data.inReview} icon={<Clock className="h-3.5 w-3.5" />} color="text-amber-400" />
                <MiniCard label={t('approved')} value={data.approved} icon={<CheckCircle2 className="h-3.5 w-3.5" />} color="text-emerald-400" />
                <MiniCard label={t('archived')} value={data.archived} icon={<Archive className="h-3.5 w-3.5" />} color="text-slate-500" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Items by Department */}
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-base font-semibold mb-4 text-foreground/80">{t('itemsByDepartment')}</h2>
                    {data.byDepartment.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tc('noResults')}</p>
                    ) : (
                        <div className="space-y-4">
                            {data.byDepartment.map((dept) => (
                                <div key={dept.id} className="group cursor-default">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">{dept.name}</span>
                                        <span className="text-xs font-bold text-muted-foreground">{dept.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                                        <div
                                            className="h-full rounded-full bg-primary/80 transition-all duration-500 group-hover:bg-primary"
                                            style={{ width: `${data.totalItems ? (dept.count / data.totalItems) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Most Viewed */}
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-base font-semibold mb-4 text-foreground/80">{t('mostViewed')}</h2>
                    {data.mostViewed.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tc('noResults')}</p>
                    ) : (
                        <div className="space-y-1">
                            {data.mostViewed.map((item, i) => (
                                <Link
                                    key={item.id}
                                    href={`/knowledge/${item.id}`}
                                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-accent/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-muted-foreground/50 w-4">{i + 1}</span>
                                        <div>
                                            <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn('text-[10px] uppercase tracking-wider font-bold rounded-md px-1.5 py-0.5', statusColors[item.status])}>
                                                    {tk(`statuses.${item.status}`)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{item.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                                        <Eye className="h-3 w-3" />
                                        {item.viewCount}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Contributors */}
                <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-base font-semibold mb-4 text-foreground/80">{t('contributionStats')}</h2>
                    {data.topContributors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{tc('noResults')}</p>
                    ) : (
                        <div className="space-y-4">
                            {data.topContributors.map((user) => (
                                <div key={user.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary text-xs font-bold border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                                            {(user.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{user.name}</p>
                                            <p className="text-[11px] text-muted-foreground">{tu(`roles.${user.role}`)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-bold">{user.itemCount}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{tk('items')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Health & Expiry Context */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-foreground/80">{t('nearExpiry')}</h2>
                            <AlertTriangle className={cn("h-4 w-4", data.nearExpiry > 0 ? "text-orange-500" : "text-emerald-500")} />
                        </div>
                        <div className="flex items-end gap-3">
                            <span className={cn(
                                'text-3xl font-bold leading-none',
                                data.nearExpiry > 0 ? 'text-orange-500' : 'text-emerald-500'
                            )}>
                                {data.nearExpiry}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                                {data.nearExpiry === 1 ? tk('item') : tk('items')}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            {data.nearExpiry === 0
                                ? t('noExpiringSoon')
                                : t('expiringSoon', { count: data.nearExpiry })}
                        </p>
                    </div>

                    <Link href="/gaps" className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-colors group">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-foreground/80">{t('gapsSubmitted')}</h2>
                            <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold leading-none text-emerald-500">
                                {data.openGaps}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                                {tk('requests')}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            {tc('viewAll')} →
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon, label, value, gradient, borderColor, textColor
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    gradient: string;
    borderColor: string;
    textColor: string;
}) {
    return (
        <div className={cn(
            'group relative rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md overflow-hidden',
            borderColor
        )}>
            {/* Ambient Background Gradient */}
            <div className={cn('absolute inset-0 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-100', gradient)} />

            <div className="relative z-10">
                <div className={cn('flex items-center gap-2 mb-3', textColor)}>
                    <div className="p-1.5 rounded-lg bg-current/10">
                        {icon}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 group-hover:text-foreground/80 transition-colors">{label}</span>
                </div>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function MiniCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-2 rounded-xl group hover:bg-white/5 transition-colors">
            <div className={cn('mb-1 group-hover:scale-110 transition-transform', color)}>{icon}</div>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60 mb-0.5">{label}</p>
            <p className="text-base font-bold leading-none">{value}</p>
        </div>
    );
}
