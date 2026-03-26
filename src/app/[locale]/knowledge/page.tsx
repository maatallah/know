'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { Plus, Search, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const [typeFilter, setTypeFilter] = useState('');
    const [riskFilter, setRiskFilter] = useState('');
    const [criticalityFilter, setCriticalityFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        fetch('/api/tags')
            .then(res => res.json())
            .then(data => setAllTags(data || []))
            .catch(() => { });
        fetch('/api/departments')
            .then(res => res.json())
            .then(data => setDepartments(data || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        fetchItems();
    }, [statusFilter, tagFilter, typeFilter, riskFilter, criticalityFilter, departmentFilter]);

    async function fetchItems(searchOverride?: string) {
        setLoading(true);
        const params = new URLSearchParams();
        const activeSearch = typeof searchOverride === 'string' ? searchOverride : search;
        if (activeSearch) params.set('search', activeSearch);
        if (statusFilter) params.set('status', statusFilter);
        if (tagFilter) params.set('tag', tagFilter);
        if (typeFilter) params.set('type', typeFilter);
        if (riskFilter) params.set('risk', riskFilter);
        if (criticalityFilter) params.set('criticality', criticalityFilter);
        if (departmentFilter) params.set('department', departmentFilter);
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
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{total} {total === 1 ? t('item') : t('items')} documentation</p>
                </div>
                <Link
                    href="/knowledge/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus className="h-4 w-4" />
                    {t('createNew')}
                </Link>
            </div>

            {/* Search + Filters (Glassmorphism Container) */}
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 space-y-4 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={tc('search')}
                            className="flex h-11 w-full rounded-xl border-border/50 bg-background/50 px-11 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    fetchItems('');
                                }}
                                className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl bg-primary/10 px-6 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
                    >
                        {tc('search')}
                    </button>
                </form>

                <div className="flex flex-wrap gap-2.5">
                    {/* Status */}
                    <FilterSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED'].map(s => ({ value: s, label: t(`statuses.${s}`) }))}
                        label={`${t('status')} — ${tc('all')}`}
                    />

                    {/* Type */}
                    <FilterSelect
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={['MACHINE_PROCEDURE', 'WORK_INSTRUCTION', 'MAINTENANCE_GUIDE', 'TROUBLESHOOTING', 'SAFETY_INSTRUCTION', 'TRAINING_GUIDE'].map(tp => ({ value: tp, label: t(`types.${tp}`) }))}
                        label={`${t('type')} — ${tc('all')}`}
                    />

                    {/* Risk Level */}
                    <FilterSelect
                        value={riskFilter}
                        onChange={setRiskFilter}
                        options={['LOW', 'MEDIUM', 'HIGH'].map(r => ({ value: r, label: t(`riskLevels.${r}`) }))}
                        label={`${t('riskLevel')} — ${tc('all')}`}
                    />

                    {/* Criticality */}
                    <FilterSelect
                        value={criticalityFilter}
                        onChange={setCriticalityFilter}
                        options={['LOW', 'MEDIUM', 'HIGH'].map(c => ({ value: c, label: t(`criticalityLevels.${c}`) }))}
                        label={`${t('criticality')} — ${tc('all')}`}
                    />

                    {/* Department */}
                    <FilterSelect
                        value={departmentFilter}
                        onChange={setDepartmentFilter}
                        options={departments.map(d => ({ value: d.id, label: d.name }))}
                        label={`${t('department')} — ${tc('all')}`}
                    />

                    {/* Tags */}
                    <FilterSelect
                        value={tagFilter}
                        onChange={setTagFilter}
                        options={allTags.map(tag => ({ value: tag.id, label: tag.name }))}
                        label={`${t('tags')} — ${tc('all')}`}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 py-20 text-center bg-card/10">
                    <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">{tc('noResults')}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/knowledge/${item.id}`}
                            className="group relative rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-foreground/90 group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">{item.department.name}</p>
                                    </div>
                                    <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border', statusColors[item.status].replace('bg-', 'bg-').replace('text-', 'text-'))}>
                                        {t(`statuses.${item.status}`)}
                                    </span>
                                </div>

                                {item.shortDescription && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        {item.shortDescription}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Badge label={t(`riskLevels.${item.riskLevel}`)} color={riskColors[item.riskLevel]} />
                                    <Badge label={t(`types.${item.type}`)} color="bg-primary/5 text-primary border-primary/10" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/5 text-primary text-[10px] font-bold border border-primary/10">
                                        {(item.owner.name || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground">{item.owner.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded-lg">
                                    <Eye className="h-3 w-3" />
                                    {item.viewCount}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 rounded-xl border border-border/50 bg-background/50 px-3 text-xs font-bold text-muted-foreground hover:bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[140px]"
        >
            <option value="">{label}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

function Badge({ label, color }: { label: string; color: string }) {
    return (
        <span className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border shadow-sm', color)}>
            {label}
        </span>
    );
}
