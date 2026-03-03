'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department: { name: string } | null;
    createdAt: string;
}

const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    DEPARTMENT_MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    EXPERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    REVIEWER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    STANDARD_USER: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

export default function UsersPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/users')
            .then((r) => r.json())
            .then((data) => setUsers(data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('users')}</h1>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground">Role</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-muted-foreground">Department</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-border last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                {(u.name || u.email)[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{u.name || 'Unnamed'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', roleColors[u.role] || roleColors.STANDARD_USER)}>
                                            {u.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.department?.name || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
