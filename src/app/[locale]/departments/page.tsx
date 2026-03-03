'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface Department {
    id: string;
    name: string;
    description: string | null;
    _count?: { knowledgeItems: number; users: number; machines: number };
}

export default function DepartmentsPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/departments')
            .then((r) => r.json())
            .then((data) => setDepartments(data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('departments')}</h1>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>
            ) : departments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {tc('noResults')}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((d) => (
                        <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold">{d.name}</h3>
                            </div>
                            {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
