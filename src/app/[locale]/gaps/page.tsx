'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Plus, AlertCircle, ArrowLeft } from 'lucide-react';

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
        <div className="mx-auto max-w-7xl space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="rounded-xl border border-border/50 bg-card p-2.5 hover:bg-accent transition-all hover:scale-105 active:scale-95 shadow-sm group shrink-0"
                        title={tc('back')}
                    >
                        <ArrowLeft className="h-5 w-5 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            {t('title')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted/50 border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
                        {gaps.length} {tc('results')}
                    </span>
                    <Link
                        href="/gaps/new"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-4 w-4" />
                        {t('submitNew')}
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-card/30 backdrop-blur-sm p-2 rounded-2xl border border-border/50 w-fit">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-xl border border-border/50 bg-background/50 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none cursor-pointer pr-8 relative"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                >
                    <option value="">{tc('all')}</option>
                    <option value="OPEN">{t('statusOpen')}</option>
                    <option value="ASSIGNED">{t('statusAssigned')}</option>
                    <option value="CLOSED">{t('statusClosed')}</option>
                </select>
            </div>

            {loading ? (
                <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto" /></div>
            ) : gaps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 py-20 text-center bg-muted/20">
                    <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                        <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{tc('noResults')}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gaps.map((gap) => (
                        <Link
                            key={gap.id}
                            href={`/gaps/${gap.id}`}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="relative space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors line-clamp-2">{gap.title}</h3>
                                    <span className={cn(
                                        'shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm transition-all',
                                        gapStatusColors[gap.status]
                                    )}>
                                        {t(`status${gap.status.charAt(0) + gap.status.slice(1).toLowerCase()}`)}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground/70 line-clamp-3 leading-relaxed">
                                    {gap.description}
                                </p>
                            </div>

                            <div className="relative mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        {(gap.submittedBy.name || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground/60">{gap.submittedBy.name}</span>
                                </div>

                                {gap.assignedTo && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/70 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                                        {gap.assignedTo.name}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
