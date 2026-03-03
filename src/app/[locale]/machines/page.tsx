'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Settings2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Machine {
    id: string;
    name: string;
    serialNumber: string | null;
    departmentId: string;
    department: { id: string; name: string };
}

interface Department {
    id: string;
    name: string;
}

export default function MachinesPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const [machines, setMachines] = useState<Machine[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', serialNumber: '', departmentId: '' });

    useEffect(() => {
        Promise.all([
            fetch('/api/machines').then((r) => r.json()),
            fetch('/api/departments').then((r) => r.json()),
        ]).then(([m, d]) => {
            setMachines(m || []);
            setDepartments(d || []);
            setLoading(false);
        });
    }, []);

    function startEdit(m: Machine) {
        setEditingId(m.id);
        setForm({ name: m.name, serialNumber: m.serialNumber || '', departmentId: m.departmentId });
        setShowAdd(false);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm({ name: '', serialNumber: '', departmentId: '' });
        setShowAdd(false);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.departmentId) return;

        if (editingId) {
            const res = await fetch(`/api/machines/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const updated = await res.json();
                setMachines((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
            }
        } else {
            const res = await fetch('/api/machines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const created = await res.json();
                setMachines((prev) => [...prev, created]);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        }
        cancelEdit();
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this machine?')) return;
        const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setMachines((prev) => prev.filter((m) => m.id !== id));
        } else {
            const err = await res.json();
            alert(err.error);
        }
    }

    const formFields = (
        <div className="space-y-3">
            <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Machine name"
                className="input-field"
                autoFocus
            />
            <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder="Serial number (optional)"
                className="input-field"
            />
            <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="input-field"
            >
                <option value="">Select department...</option>
                {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
            <div className="flex gap-2">
                <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Check className="h-4 w-4 inline-block me-1" /> {tc('save')}
                </button>
                <button onClick={cancelEdit} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
                    <X className="h-4 w-4 inline-block me-1" /> {tc('cancel')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('machines')}</h1>
                <button
                    onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', serialNumber: '', departmentId: departments[0]?.id || '' }); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" /> {tc('create')}
                </button>
            </div>

            {showAdd && (
                <div className="rounded-xl border border-primary/30 bg-card p-5">
                    <h3 className="font-semibold mb-3">New Machine</h3>
                    {formFields}
                </div>
            )}

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
                            {editingId === m.id ? (
                                formFields
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Settings2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{m.name}</h3>
                                                {m.serialNumber && <p className="text-xs text-muted-foreground">{m.serialNumber}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => startEdit(m)} className="p-1.5 rounded hover:bg-accent transition-colors">
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{m.department.name}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
