'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    department: { id: string; name: string } | null;
}

interface Department {
    id: string;
    name: string;
}

const ROLES = ['SUPER_ADMIN', 'DEPARTMENT_MANAGER', 'EXPERT', 'REVIEWER', 'STANDARD_USER'] as const;

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
    const { can } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STANDARD_USER', departmentId: '' });

    useEffect(() => {
        Promise.all([
            fetch('/api/users').then((r) => r.json()),
            fetch('/api/departments').then((r) => r.json()),
        ]).then(([u, d]) => {
            setUsers(u || []);
            setDepartments(d || []);
            setLoading(false);
        });
    }, []);

    function startEdit(u: User) {
        setEditingId(u.id);
        setForm({ name: u.name || '', email: u.email, password: '', role: u.role, departmentId: u.department?.id || '' });
        setShowAdd(false);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm({ name: '', email: '', password: '', role: 'STANDARD_USER', departmentId: '' });
        setShowAdd(false);
    }

    async function handleSave() {
        if (editingId) {
            const res = await fetch(`/api/users/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name, role: form.role, departmentId: form.departmentId }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
            }
        } else {
            if (!form.email || !form.name) return;
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const created = await res.json();
                setUsers((prev) => [...prev, created]);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        }
        cancelEdit();
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this user?')) return;
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
            const err = await res.json();
            alert(err.error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('users')}</h1>
                {can('users.create') && <button
                    onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', email: '', password: 'password123', role: 'STANDARD_USER', departmentId: '' }); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> {tc('create')}
                </button>}
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-3">
                    <h3 className="font-semibold">New User</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="input-field" autoFocus />
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-field" />
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="input-field" />
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                        </select>
                        <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="input-field">
                            <option value="">No department</option>
                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            <Check className="h-4 w-4 inline-block me-1" /> {tc('save')}
                        </button>
                        <button onClick={cancelEdit} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                            <X className="h-4 w-4 inline-block me-1" /> {tc('cancel')}
                        </button>
                    </div>
                </div>
            )}

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
                                <th className="px-4 py-3 text-end text-sm font-medium text-muted-foreground">{tc('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-border last:border-0">
                                    {editingId === u.id ? (
                                        <>
                                            <td className="px-4 py-3">
                                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                                                    {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="input-field">
                                                    <option value="">None</option>
                                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={handleSave} className="p-1.5 rounded bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
                                                    <button onClick={cancelEdit} className="p-1.5 rounded border border-border hover:bg-accent"><X className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
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
                                                    {u.role.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{u.department?.name || '-'}</td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="flex justify-end gap-1">
                                                    {can('users.edit') && <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-accent transition-colors">
                                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                                    </button>}
                                                    {can('users.delete') && <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </button>}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
