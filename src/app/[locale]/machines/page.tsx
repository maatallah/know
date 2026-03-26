'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Settings2, Plus, Pencil, Trash2, X, Check, Copy, Building2, ArrowLeft } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';
import { ConfirmModal } from '@/components/confirm-modal';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

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
    const tm = useTranslations('machines');
    const { can } = usePermissions();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', serialNumber: '', departmentId: '' });
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

    function duplicateMachine(m: Machine) {
        const tempId = `temp-${Date.now()}`;
        const copy: Machine = {
            ...m,
            id: tempId,
            name: `${m.name} (Copy)`,
            serialNumber: '', // Start fresh on SN
        };

        setMachines(prev => {
            const index = prev.findIndex(item => item.id === m.id);
            if (index === -1) return [...prev, copy];
            const next = [...prev];
            next.splice(index + 1, 0, copy);
            return next;
        });

        setEditingId(tempId);
        setForm({ name: copy.name, serialNumber: '', departmentId: copy.departmentId });
        setShowAdd(false);
    }

    function cancelEdit() {
        if (editingId?.startsWith('temp-')) {
            setMachines(prev => prev.filter(m => m.id !== editingId));
        }
        setEditingId(null);
        setForm({ name: '', serialNumber: '', departmentId: '' });
        setShowAdd(false);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.departmentId) return;

        const isNew = !editingId || editingId.startsWith('temp-');

        if (!isNew) {
            // Updating existing record
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
            // Creating new record (either from top form or virtual card)
            const res = await fetch('/api/machines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const created = await res.json();
                if (editingId?.startsWith('temp-')) {
                    // Replace the virtual record with the saved one
                    setMachines((prev) => prev.map((m) => (m.id === editingId ? created : m)));
                } else {
                    // Normal add from top form
                    setMachines((prev) => [...prev, created]);
                }
            } else {
                const err = await res.json();
                alert(err.error);
            }
        }
        setEditingId(null);
        setForm({ name: '', serialNumber: '', departmentId: '' });
        setShowAdd(false);
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMachines((prev) => prev.filter((m) => m.id !== id));
                setConfirmDeleteId(null); // Close the modal on success
            } else {
                const text = await res.text();
                try {
                    const err = JSON.parse(text);
                    alert(err.error || tc('error'));
                } catch {
                    alert(`Server error (${res.status}): ${text.slice(0, 100)}`);
                }
            }
        } catch (err) {
            console.error(err);
            alert(tc('error'));
        }
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-3">
                        <Settings2 className="h-6 w-6 text-primary" />
                        {t('machines')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{machines.length} {tm('devicesRegistered')}</p>
                </div>
                {can('machines.create') && (
                    <button
                        onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', serialNumber: '', departmentId: departments[0]?.id || '' }); }}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus className="h-4 w-4" /> {tc('create')}
                    </button>
                )}
            </div>

            {showAdd && (
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Settings2 className="h-24 w-24 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-primary/80 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> {tm('newMachine')}
                    </h3>
                    <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tm('machineName')}</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder={tm('machineNamePlaceholder')}
                                className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tm('serialNumberOptional')}</label>
                            <input
                                type="text"
                                value={form.serialNumber}
                                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                placeholder={tm('serialNumberPlaceholder')}
                                className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{tc('selectDepartment')}</label>
                            <select
                                value={form.departmentId}
                                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                className="w-full px-4 py-2 text-sm rounded-xl border border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">{tc('selectDepartment')}</option>
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
                <div className="py-20 text-center text-muted-foreground">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4" />
                    {tc('loading')}
                </div>
            ) : machines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 py-20 text-center bg-card/10">
                    <Settings2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">{tc('noResults')}</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {machines.map((m) => {
                        const isVirtual = m.id.startsWith('temp-');
                        return (
                            <div
                                key={m.id}
                                className={cn(
                                    "group relative rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                                    isVirtual
                                        ? "border-2 border-dashed border-primary/40 bg-primary/5"
                                        : "border-border/50 hover:border-primary/20"
                                )}
                            >
                                {editingId === m.id ? (
                                    <div className="space-y-3 animate-in fade-in duration-300">
                                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/30 bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                                        <input type="text" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-border/50 bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                                        <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/30 bg-background appearance-none cursor-pointer outline-none">
                                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={handleSave} className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all outline-none"><Check className="h-4 w-4 mx-auto" /></button>
                                            <button onClick={cancelEdit} className="flex-1 p-2 rounded-lg border border-border/50 bg-background hover:bg-accent transition-all outline-none"><X className="h-4 w-4 mx-auto" /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/5 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300 relative overflow-hidden">
                                                    <Settings2 className="h-5 w-5 relative z-10" />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors leading-snug">
                                                        <Link href={`/machines/${m.id}`}>{m.name}</Link>
                                                    </h3>
                                                    {m.serialNumber ? (
                                                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">{m.serialNumber}</p>
                                                    ) : (
                                                        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter">{tm('noSerialNumber')}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                {can('machines.create') && (
                                                    <button onClick={() => duplicateMachine(m)} className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90" title={tm('duplicateMachine')}>
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {can('machines.edit') && (
                                                    <button onClick={() => startEdit(m)} className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {can('machines.delete') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setConfirmDeleteId(m.id);
                                                        }}
                                                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/30 border border-border/30 text-[10px] font-bold text-foreground/70 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                                                <Building2 className="h-3 w-3 text-muted-foreground/50" />
                                                {m.department.name}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                title={tc('confirm')}
                message={tm('deleteMachine')}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
                variant="danger"
                confirmText={tc('delete')}
            />
        </div>
    );
}
