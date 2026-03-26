'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Shield, Clock, Filter, ChevronLeft, ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/lib/usePermissions';
import { ConfirmModal } from '@/components/confirm-modal';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    details: any;
    createdAt: string;
    user: { id: string; name: string | null; email: string };
}

const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50',
    UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
    APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
    SUBMIT_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
    ARCHIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400 border-gray-200 dark:border-gray-700/50',
    LOGIN: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-900/50',
};

export default function AuditLogPage() {
    const tc = useTranslations('common');
    const t = useTranslations('audit');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const { can, user, loading: permsLoading } = usePermissions();



    useEffect(() => {
        setLoading(true);
        const url = new URL('/api/audit', window.location.origin);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', '25');
        if (actionFilter) url.searchParams.set('action', actionFilter);
        if (fromDate) url.searchParams.set('from', fromDate);
        if (toDate) url.searchParams.set('to', toDate);

        fetch(url.toString())
            .then(res => {
                if (!res.ok) throw new Error('Forbidden');
                return res.json();
            })
            .then(data => {
                setLogs(data.logs || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                setLogs([]);
            });
    }, [page, actionFilter, fromDate, toDate]);

    async function handleCleanup() {
        setCleaning(true);
        try {
            const res = await fetch('/api/audit', { method: 'DELETE' });
            if (res.ok) {
                alert(t('cleanSuccess'));
                // Refresh logs
                setPage(1);
                const url = new URL('/api/audit', window.location.origin);
                const refreshed = await fetch(url.toString()).then(r => r.json());
                setLogs(refreshed.logs || []);
                setTotal(refreshed.total || 0);
                setTotalPages(refreshed.totalPages || 1);
            } else {
                alert('Cleanup failed');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during cleanup');
        } finally {
            setCleaning(false);
            setIsCleanupModalOpen(false);
        }
    }

    const renderDetails = (details: any) => {
        if (!details || Object.keys(details).length === 0) return (
            <span className="text-[10px] italic text-muted-foreground/50">{t('noExtraData')}</span>
        );

        const translatableValues = ['CLOSED', 'OPEN', 'PENDING', 'APPROVED', 'REJECTED'];

        return (
            <div className="space-y-2 py-0.5">
                {Object.entries(details).map(([key, value]) => {
                    const labelKey = `detailsLabels.${key}`;
                    let label = key;
                    // Try to translate label, fallback to formatted key
                    try {
                        const translated = t(labelKey);
                        label = translated === labelKey ? key : translated;
                    } catch (e) {
                        label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    }
                    
                    const stringValue = String(value);
                    let displayValue = stringValue;
                    
                    // Only try to translate if it's in our known list of translatable values
                    if (translatableValues.includes(stringValue.toUpperCase())) {
                        const valueKey = `detailsValues.${stringValue.toUpperCase()}`;
                        try {
                            const translated = t(valueKey);
                            displayValue = translated === valueKey ? stringValue : translated;
                        } catch (e) {
                            displayValue = stringValue;
                        }
                    }

                    return (
                        <div key={key} className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none">
                                {label}
                            </span>
                            <span className="text-[10px] font-medium text-foreground/80 break-all leading-snug">
                                {displayValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                            <Shield className="h-6 w-6" />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {can('audit.cleanup') && (
                        <button
                            onClick={() => setIsCleanupModalOpen(true)}
                            disabled={cleaning}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive hover:text-destructive-foreground border border-destructive/30 hover:bg-destructive rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {cleaning ? tc('loading') : t('cleanupLogs')}
                        </button>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted/50 border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
                        {total} {tc('results')}
                    </span>
                </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
                <div className="p-4 px-6 border-b border-border/50 bg-muted/20 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="relative w-full lg:max-w-xs">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:outline-none appearance-none transition-all cursor-pointer"
                        >
                            <option value="">{t('allActions')}</option>
                            <option value="LOGIN">{t('actionLabels.LOGIN')}</option>
                            <option value="CREATE">{t('actionLabels.CREATE')}</option>
                            <option value="UPDATE">{t('actionLabels.UPDATE')}</option>
                            <option value="SUBMIT_REVIEW">{t('actionLabels.SUBMIT_REVIEW')}</option>
                            <option value="APPROVAL">{t('actionLabels.APPROVAL')}</option>
                            <option value="ARCHIVE">{t('actionLabels.ARCHIVE')}</option>
                            <option value="DELETE">{t('actionLabels.DELETE')}</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-background/50 border border-border/50 px-3 py-1.5 rounded-xl">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 w-28 uppercase"
                            />
                            <span className="text-muted-foreground/30 font-bold px-1">—</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 w-28 uppercase"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-border/50 rounded-xl bg-background/50 hover:bg-accent disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
                        </button>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/20 bg-muted/40 text-xs font-bold">
                            <span className="text-primary">{page}</span>
                            <span className="text-muted-foreground/40">/</span>
                            <span className="text-muted-foreground">{totalPages}</span>
                        </div>
                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-border/50 rounded-xl bg-background/50 hover:bg-accent disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <div className="hidden lg:block">
                        <table className="w-full text-sm text-start border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/40 border-b border-border/50">
                                    <th className="px-6 py-4 font-bold text-start">{t('timestamp')}</th>
                                    <th className="px-6 py-4 font-bold text-start">{t('involvedPerson')}</th>
                                    <th className="px-6 py-4 font-bold text-center">{t('operation')}</th>
                                    <th className="px-6 py-4 font-bold text-start">{t('targetResource')}</th>
                                    <th className="px-6 py-4 font-bold text-start">{t('impactDetails')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto" /></td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center"><p className="text-sm font-medium text-muted-foreground/50">{t('noActivitiesTimeframe')}</p></td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-primary/5 transition-all">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-bold text-foreground/80">{new Date(log.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-medium text-muted-foreground/50">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {(log.user?.name || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-foreground/80">{log.user?.name || t('systemAuto')}</div>
                                                        <div className="text-[10px] text-muted-foreground/60">{log.user?.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={cn(
                                                    'inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm',
                                                    actionColors[log.action] || 'bg-muted text-muted-foreground border-border'
                                                )}>
                                                    {t(`actionLabels.${log.action}`) || log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30 border border-border/30">
                                                    <span className="text-[10px] font-bold text-foreground/70">
                                                        {(() => {
                                                            const entityKey = `entityLabels.${log.entityType}`;
                                                            try {
                                                                const translated = t(entityKey);
                                                                return translated === entityKey ? log.entityType : translated;
                                                            } catch (e) {
                                                                return log.entityType;
                                                            }
                                                        })()}
                                                    </span>
                                                    <span className="h-3 w-[1px] bg-border/50" />
                                                    <span className="text-[10px] font-mono text-muted-foreground/60 uppercase" title={log.entityId}>
                                                        {log.entityId.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs align-top">
                                                <div className="max-h-[100px] overflow-y-auto scrollbar-hide py-1">
                                                    {renderDetails(log.details)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden divide-y divide-border/50">
                        {loading ? (
                            <div className="py-20 text-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto" /></div>
                        ) : logs.length === 0 ? (
                            <div className="py-20 text-center"><p className="text-sm font-medium text-muted-foreground/50">{t('noActivitiesTimeframe')}</p></div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="p-4 space-y-3 hover:bg-primary/5 transition-all">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {(log.user?.name || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground/80">{log.user?.name || t('systemAuto')}</p>
                                                <p className="text-[9px] text-muted-foreground/50">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border shadow-sm',
                                            actionColors[log.action] || 'bg-muted text-muted-foreground border-border'
                                        )}>
                                            {t(`actionLabels.${log.action}`) || log.action}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/30 border border-border/30 text-[9px] font-bold text-foreground/70">
                                            {t(`entityLabels.${log.entityType}`) || log.entityType}
                                        </div>
                                        <span className="text-[9px] font-mono text-muted-foreground/60 bg-muted/20 px-1.5 py-0.5 rounded border border-border/30">
                                            ID: {log.entityId.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="p-3 bg-muted/20 border-t border-border/30">
                                        <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
                                            {t('impactDetails')}
                                        </div>
                                        <div className="max-h-[100px] overflow-y-auto scrollbar-hide">
                                            {renderDetails(log.details)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isCleanupModalOpen}
                onConfirm={handleCleanup}
                onCancel={() => setIsCleanupModalOpen(false)}
                title={t('cleanupLogs')}
                message={t('cleanupConfirm')}
                variant="danger"
                confirmText={tc('delete')}
                cancelText={tc('cancel')}
            />
        </div>
    );
}
