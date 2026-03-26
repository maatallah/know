'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

interface GapDetail {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
    submittedBy: { id: string; name: string | null };
    assignedTo: { id: string; name: string | null } | null;
    linkedItem: { id: string; title: string } | null;
    rejectReason: string | null;
}

const gapStatusColors: Record<string, string> = {
    OPEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    CLOSED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function GapDetailPage() {
    const t = useTranslations('gaps');
    const tc = useTranslations('common');
    const params = useParams();
    const id = params.id as string;
    const [gap, setGap] = useState<GapDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        fetch(`/api/gaps/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) setGap(null);
                else setGap(data);
            })
            .finally(() => setLoading(false));
    }, [id]);

    async function updateStatus(status: string, reason?: string) {
        setActionLoading(true);
        const res = await fetch(`/api/gaps/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, rejectReason: reason }),
        });
        if (res.ok) {
            setGap(await res.json());
            setShowCloseModal(false);
            setRejectReason("");
        } else {
            const data = await res.json();
            alert(data.error || 'Operation failed');
        }
        setActionLoading(false);
    }

    if (loading) return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    if (!gap) return <div className="py-12 text-center text-muted-foreground">{t('notFound')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <Link href="/gaps" className="mt-1 rounded-lg p-2 hover:bg-accent transition-colors">
                    <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{gap.title}</h1>
                        <span className={cn('rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider', gapStatusColors[gap.status])}>
                            {t(`status${gap.status.charAt(0) + gap.status.slice(1).toLowerCase()}`)}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t('submittedBy')} {gap.submittedBy.name}</p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-2">{t('gapDescription')}</h2>
                <p className="text-sm whitespace-pre-wrap">{gap.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {gap.assignedTo && (
                    <div className="rounded-lg border border-border bg-card px-4 py-3">
                        <span className="text-xs font-medium text-muted-foreground">{t('assignedTo')}</span>
                        <p className="text-sm font-medium mt-0.5">{gap.assignedTo.name}</p>
                    </div>
                )}
                {gap.linkedItem && (
                    <Link
                        href={`/knowledge/${gap.linkedItem.id}`}
                        className="rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/30 transition-colors"
                    >
                        <span className="text-xs font-medium text-muted-foreground">{t('linkedItem')}</span>
                        <p className="text-sm font-medium mt-0.5 text-primary">{gap.linkedItem.title}</p>
                    </Link>
                )}
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold">{t('actions')}</h2>
                <div className="flex flex-wrap gap-2">
                    {gap.status === 'OPEN' && (
                        <button
                            onClick={() => updateStatus('ASSIGNED')}
                            disabled={actionLoading}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {t('markAssigned')}
                        </button>
                    )}
                    {(gap.status === 'OPEN' || gap.status === 'ASSIGNED') && (
                        <button
                            onClick={() => gap.linkedItem ? updateStatus('CLOSED') : setShowCloseModal(true)}
                            disabled={actionLoading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-green-50 hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {t('closeGap')}
                        </button>
                    )}
                    {gap.status === 'CLOSED' && !gap.rejectReason && (
                        <p className="text-sm text-muted-foreground">{t('resolvedMsg')}</p>
                    )}
                </div>
                {gap.status === 'CLOSED' && gap.rejectReason && (
                    <div className="mt-4 rounded-lg bg-destructive/5 p-4 border border-destructive/20">
                        <h3 className="text-sm font-bold text-destructive">{t('rejectReasonTitle')}</h3>
                        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{gap.rejectReason}</p>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold">{t('closeGapModalTitle')}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t('closeGapModalDesc')}</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="mt-4 w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none transition-all placeholder:text-muted-foreground/50"
                            placeholder={t('rejectReasonPlaceholder')}
                            autoFocus
                        />
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                disabled={actionLoading}
                            >
                                {tc('cancel')}
                            </button>
                            <button
                                onClick={() => updateStatus('CLOSED', rejectReason)}
                                disabled={!rejectReason.trim() || actionLoading}
                                className="rounded-xl bg-destructive px-5 py-2 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {t('confirmClose')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
