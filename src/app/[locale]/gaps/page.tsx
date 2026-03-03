'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Plus, AlertCircle } from 'lucide-react';

interface GapRequest {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    submittedBy: { id: string; name: string | null };
    assignedTo: { id: string; name: string | null } | null;
    linkedItem: { id: string; title: string } | null;
}

const gapStatusColors: Record<string, string> = {
    OPEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    CLOSED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function GapsPage() {
    const t = useTranslations('gaps');
    const tc = useTranslations('common');
    const [gaps, setGaps] = useState<GapRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchGaps();
    }, [statusFilter]);

    async function fetchGaps() {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/gaps?${params}`);
        const data = await res.json();
        setGaps(data || []);
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <Link
                    href="/gaps/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    {t('submitNew')}
                </Link>
            </div>

            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <option value="">All</option>
                <option value="OPEN">{t('statusOpen')}</option>
                <option value="ASSIGNED">{t('statusAssigned')}</option>
                <option value="CLOSED">{t('statusClosed')}</option>
            </select>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>
            ) : gaps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {tc('noResults')}
                </div>
            ) : (
                <div className="space-y-3">
                    {gaps.map((gap) => (
                        <Link
                            key={gap.id}
                            href={`/gaps/${gap.id}`}
                            className="block rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-orange-500" />
                                        <h3 className="font-semibold">{gap.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{gap.description}</p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', gapStatusColors[gap.status])}>
                                            {t(`status${gap.status.charAt(0) + gap.status.slice(1).toLowerCase()}`)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">by {gap.submittedBy.name}</span>
                                    </div>
                                </div>
                                {gap.assignedTo && (
                                    <span className="text-xs text-muted-foreground">→ {gap.assignedTo.name}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
