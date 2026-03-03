'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';

interface Machine {
    id: string;
    name: string;
    serialNumber: string | null;
    department: { name: string };
    createdAt: string;
}

export default function MachinesPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/machines')
            .then((r) => r.json())
            .then((data) => setMachines(data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('machines')}</h1>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>
            ) : machines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {tc('noResults')}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {machines.map((m) => (
                        <div key={m.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Settings2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{m.name}</h3>
                                    {m.serialNumber && <p className="text-xs text-muted-foreground">{m.serialNumber}</p>}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{m.department.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
