'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AuditEntry {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown> | null;
    createdAt: string;
    user: { id: string; name: string | null };
}

const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    SUBMIT_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    ARCHIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

export default function AuditPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/audit')
            .then((r) => r.json())
            .then((data) => setEntries(data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('audit')}</h1>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>
            ) : entries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {tc('noResults')}
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', actionColors[entry.action] || 'bg-gray-100 text-gray-800')}>
                                        {entry.action}
                                    </span>
                                    <span className="text-sm font-medium">{entry.entityType}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(entry.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                <span>by {entry.user.name || 'Unknown'}</span>
                                <span>·</span>
                                <span className="font-mono text-xs">{entry.entityId.slice(0, 8)}...</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
