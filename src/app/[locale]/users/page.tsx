'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Check, User, Building2 } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';
import { ConfirmModal } from '@/components/confirm-modal';

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
    const tu = useTranslations('users');
    const { can } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STANDARD_USER', departmentId: '' });
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setConfirmDeleteId(null);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                            <User className="h-6 w-6" />
                        </div>
                        {t('users')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{tu('manageAccessSubtitle')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted/50 border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
                        {users.length} {tc('results')}
                    </span>
                    {can('users.create') && (
                        <button
                            onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', email: '', password: 'password123', role: 'STANDARD_USER', departmentId: '' }); }}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                        >
                            <Plus className="h-4 w-4" /> {tc('create')}
                        </button>
                    )}
                </div>
            </div>

            {/* Add user form */}
            {showAdd && (
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Plus className="h-24 w-24 text-primary" />
                    </div>
                    <div className="relative flex items-center justify-between">
                        <h3 className="text-base font-bold text-primary/80 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> {tu('newUser')}
                        </h3>
                    </div>
                    <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tc('fullName')}</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tc('namePlaceholder') || "John Doe"} className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" autoFocus />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tc('email')}</label>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={tc('emailPlaceholder') || "name@company.com"} className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tc('password')}</label>
                            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={tc('passwordPlaceholder') || "••••••••"} className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tc('role')}</label>
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none cursor-pointer">
                                {ROLES.map((r) => <option key={r} value={r}>{tu(`roles.${r}`)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tc('department')}</label>
                            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none cursor-pointer">
                                <option value="">{tc('noDepartment')}</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={handleSave} className="flex-1 sm:flex-none rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 group">
                            <Check className="h-3.5 w-3.5 inline-block me-1.5 group-hover:scale-110 transition-transform" /> {tc('save')}
                        </button>
                        <button onClick={cancelEdit} className="flex-1 sm:flex-none rounded-xl border border-border/50 bg-background/50 px-6 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent transition-all">
                            <X className="h-3.5 w-3.5 inline-block me-1.5" /> {tc('cancel')}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto" /></div>
            ) : (
                <div className="space-y-4">
                    {/* Mobile Desktop Toggle: Hidden on mobile, shown on md+ */}
                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
                        <table className="w-full text-sm text-start border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-muted/40 border-b border-border/50">
                                    <th className="px-6 py-4 font-bold text-start">{tc('name')}</th>
                                    <th className="px-6 py-4 font-bold text-start">{tc('email')}</th>
                                    <th className="px-6 py-4 font-bold text-center">{tc('role')}</th>
                                    <th className="px-6 py-4 font-bold text-start">{tc('department')}</th>
                                    <th className="px-6 py-4 font-bold text-end shrink-0 w-[100px]">{tc('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {users.map((u) => (
                                    <tr key={u.id} className="group hover:bg-primary/5 transition-all">
                                        {editingId === u.id ? (
                                            <>
                                                <td className="px-6 py-3">
                                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/30 bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                                                </td>
                                                <td className="px-6 py-3 text-xs text-muted-foreground font-medium">{u.email}</td>
                                                <td className="px-6 py-3">
                                                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/30 bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none cursor-pointer">
                                                        {ROLES.map((r) => <option key={r} value={r}>{tu(`roles.${r}`)}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/30 bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none cursor-pointer">
                                                        <option value="">{tc('none')}</option>
                                                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-3 text-end">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={handleSave} className="p-2 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none"><Check className="h-4 w-4" /></button>
                                                        <button onClick={cancelEdit} className="p-2 rounded-lg border border-border/50 bg-background hover:bg-accent hover:scale-105 active:scale-95 transition-all outline-none"><X className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary text-[10px] font-bold border border-primary/5 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                            {(u.name || u.email)[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">{u.name || tu('unnamed')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-muted-foreground/70">{u.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm transition-all',
                                                        roleColors[u.role] || 'bg-muted text-muted-foreground border-border'
                                                    )}>
                                                        {tu(`roles.${u.role}`)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/30 border border-border/30 text-[10px] font-bold text-foreground/70 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all min-w-[120px] max-w-[180px]">
                                                        <Building2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                                        <span className="truncate">{u.department?.name || tc('none')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-end">
                                                    <div className="flex justify-end gap-1.5">
                                                        {can('users.edit') && (
                                                            <button onClick={() => startEdit(u)} className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-95 group/btn">
                                                                <Pencil className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                        )}
                                                        {can('users.delete') && (
                                                            <button onClick={() => setConfirmDeleteId(u.id)} className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95 group/btn">
                                                                <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List: Shown on mobile, hidden on md+ */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {users.map((u) => (
                            <div key={u.id} className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/5">
                                            {(u.name || u.email)[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground/90">{u.name || tu('unnamed')}</h3>
                                            <p className="text-[10px] font-medium text-muted-foreground/60">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {can('users.edit') && (
                                            <button onClick={() => startEdit(u)} className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        )}
                                        {can('users.delete') && (
                                            <button onClick={() => setConfirmDeleteId(u.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <span className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-sm',
                                        roleColors[u.role] || 'bg-muted text-muted-foreground border-border'
                                    )}>
                                        {tu(`roles.${u.role}`)}
                                    </span>
                                    {u.department && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/30 border border-border/30 text-[9px] font-bold text-foreground/70">
                                            <Building2 className="h-3 w-3 text-muted-foreground/50" />
                                            {u.department.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                title={tc('confirm')}
                message={tu('deleteUser')}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
                variant="danger"
                confirmText={tc('delete')}
            />
        </div>
    );
}
