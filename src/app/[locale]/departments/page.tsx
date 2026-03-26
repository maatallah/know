'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';
import { ConfirmModal } from '@/components/confirm-modal';

interface Department {
    id: string;
    name: string;
    description: string | null;
    _count?: { users: number; machines: number; knowledgeItems: number };
}

export default function DepartmentsPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const td = useTranslations('departments');
    const { can } = usePermissions();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    async function fetchDepartments() {
        setLoading(true);
        const res = await fetch('/api/departments');
        setDepartments(await res.json());
        setLoading(false);
    }

    function startEdit(d: Department) {
        setEditingId(d.id);
        setForm({ name: d.name, description: d.description || '' });
        setShowAdd(false);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm({ name: '', description: '' });
        setShowAdd(false);
    }

    async function handleSave() {
        if (!form.name.trim()) return;

        if (editingId) {
            const res = await fetch(`/api/departments/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const updated = await res.json();
                setDepartments((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
            }
        } else {
            const res = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const created = await res.json();
                setDepartments((prev) => [...prev, created]);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        }
        cancelEdit();
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setDepartments((prev) => prev.filter((d) => d.id !== id));
            setConfirmDeleteId(null);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90">{t('departments')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{td('activeUnits', { count: departments.length })}</p>
                </div>
                {can('departments.create') && (
                    <button
                        onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', description: '' }); }}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus className="h-4 w-4" /> {tc('create')}
                    </button>
                )}
            </div>

            {/* Add form (Glassmorphism) */}
            {showAdd && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-6 space-y-4 shadow-inner">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{td('newDepartment')}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{td('departmentName')}</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={td('departmentName')}
                                className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{tc('description')}</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder={td('descriptionOptional')}
                                className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleSave} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/10">
                            <Check className="h-4 w-4 inline-block me-1" /> {tc('save')}
                        </button>
                        <button onClick={cancelEdit} className="rounded-xl border border-border/50 bg-background/50 px-5 py-2 text-sm font-bold hover:bg-accent transition-all text-muted-foreground">
                            <X className="h-4 w-4 inline-block me-1" /> {tc('cancel')}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                </div>
            ) : departments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 py-20 text-center bg-card/10">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">{tc('noResults')}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((d) => (
                        <div key={d.id} className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between">
                            {editingId === d.id ? (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{td('departmentName')}</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder={td('departmentName')}
                                            className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{tc('description')}</label>
                                        <input
                                            type="text"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder={td('descriptionOptional')}
                                            className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all"><Check className="h-4 w-4" /></button>
                                        <button onClick={cancelEdit} className="rounded-lg border border-border/50 bg-background/50 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-accent transition-all"><X className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/10 shadow-inner group-hover:scale-110 transition-transform">
                                                    <Building2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground/90 group-hover:text-primary transition-colors">{d.name}</h3>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {can('departments.edit') && (
                                                    <button onClick={() => startEdit(d)} className="p-1.5 rounded-lg border border-transparent hover:border-border/50 hover:bg-background transition-all text-muted-foreground hover:text-primary">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {can('departments.delete') && (
                                                    <button onClick={() => setConfirmDeleteId(d.id)} className="p-1.5 rounded-lg border border-transparent hover:border-destructive/20 hover:bg-destructive/5 transition-all text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {d.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{d.description}</p>}
                                    </div>

                                    {d._count && (
                                        <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-3 gap-2">
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{td('users')}</p>
                                                <p className="text-xs font-bold text-foreground/70">{d._count.users}</p>
                                            </div>
                                            <div className="text-center border-x border-border/50">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{td('machines')}</p>
                                                <p className="text-xs font-bold text-foreground/70">{d._count.machines}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{td('items')}</p>
                                                <p className="text-xs font-bold text-foreground/70">{d._count.knowledgeItems}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                title={tc('confirm')}
                message={td('deleteDepartment')}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
                variant="danger"
                confirmText={tc('delete')}
            />
        </div>
    );
}
