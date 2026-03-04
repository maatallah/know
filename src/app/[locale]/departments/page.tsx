'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

interface Department {
    id: string;
    name: string;
    description: string | null;
    _count?: { users: number; machines: number; knowledgeItems: number };
}

export default function DepartmentsPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const { can } = usePermissions();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', description: '' });

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
        if (!confirm('Delete this department?')) return;
        const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setDepartments((prev) => prev.filter((d) => d.id !== id));
        } else {
            const err = await res.json();
            alert(err.error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('departments')}</h1>
                {can('departments.create') && <button
                    onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', description: '' }); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> {tc('create')}
                </button>}
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-3">
                    <h3 className="font-semibold">New Department</h3>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Department name"
                        className="input-field"
                        autoFocus
                    />
                    <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="input-field"
                    />
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
            ) : departments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {tc('noResults')}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((d) => (
                        <div key={d.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            {editingId === d.id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="input-field"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Description"
                                        className="input-field"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><Check className="h-3 w-3" /></button>
                                        <button onClick={cancelEdit} className="rounded border border-border px-3 py-1.5 text-xs"><X className="h-3 w-3" /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <h3 className="font-semibold">{d.name}</h3>
                                        </div>
                                        <div className="flex gap-1">
                                            {can('departments.edit') && <button onClick={() => startEdit(d)} className="p-1.5 rounded hover:bg-accent transition-colors">
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </button>}
                                            {can('departments.delete') && <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </button>}
                                        </div>
                                    </div>
                                    {d.description && <p className="text-sm text-muted-foreground mb-2">{d.description}</p>}
                                    {d._count && (
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span>{d._count.users} users</span>
                                            <span>{d._count.machines} machines</span>
                                            <span>{d._count.knowledgeItems} items</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
