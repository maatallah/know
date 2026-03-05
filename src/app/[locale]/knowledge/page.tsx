'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Search, Eye } from 'lucide-react';

interface Tag {
    id: string;
    name: string;
}

interface KnowledgeItem {
    id: string;
    title: string;
    shortDescription: string | null;
    type: string;
    riskLevel: string;
    status: string;
    viewCount: number;
    healthScore: number;
    createdAt: string;
    owner: { id: string; name: string | null };
    department: { id: string; name: string };
    tags: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

const riskColors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    MEDIUM: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function KnowledgeListPage() {
    const t = useTranslations('knowledge');
    const tc = useTranslations('common');
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [allTags, setAllTags] = useState<Tag[]>([]);

    useEffect(() => {
        fetch('/api/tags')
            .then(res => res.json())
            .then(data => setAllTags(data || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        fetchItems();
    }, [statusFilter, tagFilter]);

    async function fetchItems() {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        if (tagFilter) params.set('tag', tagFilter);
        const res = await fetch(`/api/knowledge?${params}`);
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setLoading(false);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        fetchItems();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <Link
                    href="/knowledge/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    {t('createNew')}
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={tc('search')}
                            className="flex h-10 w-full rounded-lg border border-input bg-background ps-10 pe-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                        {tc('search')}
                    </button>
                </form>

                <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">{t('tags')} — All</option>
                    {allTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                            {tag.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">{t('status')} — All</option>
                    {['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED'].map((s) => (
                        <option key={s} value={s}>
                            {t(`statuses.${s}`)}
                        </option>
                    ))}
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {tc('noResults')}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/knowledge/${item.id}`}
                            className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold">{item.title}</h3>
                                    {item.shortDescription && (
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {item.shortDescription}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[item.status])}>
                                            {t(`statuses.${item.status}`)}
                                        </span>
                                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', riskColors[item.riskLevel])}>
                                            {t(`riskLevels.${item.riskLevel}`)}
                                        </span>
                                        <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                            {t(`types.${item.type}`)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        {item.viewCount}
                                    </span>
                                    <span>{item.department.name}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
