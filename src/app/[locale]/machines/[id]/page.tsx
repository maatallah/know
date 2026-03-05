'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { ArrowLeft, Settings2, Calendar, FileText, Printer, Pencil, Trash2, Copy, Check, X } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { usePermissions } from '@/lib/usePermissions';

interface KnowledgeItem {
    id: string;
    title: string;
    type: string;
    status: string;
    updatedAt: string;
    owner: { name: string | null };
}

interface Department {
    id: string;
    name: string;
}

interface MachineProfile {
    id: string;
    name: string;
    serialNumber: string | null;
    departmentId: string;
    createdAt: string;
    department: { id: string; name: string };
    knowledgeItems: KnowledgeItem[];
}

const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

export default function MachineProfilePage() {
    const t = useTranslations('machines');
    const tc = useTranslations('common');
    const tk = useTranslations('knowledge');
    const { can } = usePermissions();
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [machine, setMachine] = useState<MachineProfile | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', serialNumber: '', departmentId: '' });

    const [domain, setDomain] = useState('');

    useEffect(() => {
        setDomain(window.location.origin);
        Promise.all([
            fetch(`/api/machines/${id}`).then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            }),
            fetch('/api/departments').then(res => res.json()),
        ]).then(([machineData, deptData]) => {
            setMachine(machineData);
            setDepartments(deptData || []);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, [id]);

    function startEdit() {
        if (!machine) return;
        setForm({
            name: machine.name,
            serialNumber: machine.serialNumber || '',
            departmentId: machine.departmentId,
        });
        setEditing(true);
    }

    function cancelEdit() {
        setEditing(false);
        setForm({ name: '', serialNumber: '', departmentId: '' });
    }

    async function handleSave() {
        if (!form.name.trim() || !form.departmentId) return;
        setSaving(true);
        const res = await fetch(`/api/machines/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            const updated = await res.json();
            setMachine(prev => prev ? {
                ...prev,
                name: updated.name,
                serialNumber: updated.serialNumber,
                departmentId: updated.departmentId,
                department: updated.department,
            } : prev);
            setEditing(false);
        }
        setSaving(false);
    }

    async function handleDelete() {
        if (!confirm(t('deleteMachine'))) return;
        const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
        if (res.ok) {
            router.push('/machines');
        } else {
            const err = await res.json();
            alert(err.error);
        }
    }

    function handleDuplicate() {
        if (!machine) return;
        // Navigate to machines list page with query params to pre-fill
        router.push(`/machines?duplicate=${encodeURIComponent(machine.name)}&dept=${machine.departmentId}`);
    }

    if (loading) {
        return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    }

    if (!machine) {
        return <div className="py-12 text-center text-destructive">Machine not found.</div>;
    }

    const qrUrl = `${domain}/machines/${machine.id}`;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Top bar: Back + Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                    {tc('back')}
                </button>

                <div className="flex items-center gap-2">
                    {can('machines.create') && (
                        <button
                            onClick={handleDuplicate}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                            title={t('duplicateMachine')}
                        >
                            <Copy className="h-4 w-4" />
                            {t('duplicateMachine')}
                        </button>
                    )}
                    {can('machines.edit') && !editing && (
                        <button
                            onClick={startEdit}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Pencil className="h-4 w-4" />
                            {tc('edit')}
                        </button>
                    )}
                    {can('machines.delete') && (
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            {tc('delete')}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <div className="md:col-span-2 space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        {editing ? (
                            /* ── Inline Edit Form ── */
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold mb-2">{tc('edit')} — {machine.name}</h2>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('machineName')}</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="input-field"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('serialNumberOptional')}</label>
                                    <input
                                        type="text"
                                        value={form.serialNumber}
                                        onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">{tc('department')}</label>
                                    <select
                                        value={form.departmentId}
                                        onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                        className="input-field"
                                    >
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        <Check className="h-4 w-4 inline-block me-1" /> {tc('save')}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                                    >
                                        <X className="h-4 w-4 inline-block me-1" /> {tc('cancel')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── View Mode ── */
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Settings2 className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold tracking-tight">{machine.name}</h1>
                                        <p className="text-muted-foreground text-lg">{machine.department.name}</p>
                                    </div>
                                </div>

                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <dt className="text-muted-foreground">{t('serialNumberOptional')}</dt>
                                        <dd className="font-medium">{machine.serialNumber || '—'}</dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-muted-foreground">{tc('createdAt')}</dt>
                                        <dd className="font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {new Date(machine.createdAt).toLocaleDateString()}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-muted-foreground">ID</dt>
                                        <dd className="font-mono text-xs truncate" title={machine.id}>{machine.id}</dd>
                                    </div>
                                </dl>
                            </>
                        )}
                    </div>

                    {/* History Section */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border bg-muted/40 px-6 py-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Knowledge History
                            </h2>
                        </div>
                        <div className="p-0">
                            {machine.knowledgeItems.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No procedures or guides linked to this machine yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {machine.knowledgeItems.map(item => (
                                        <Link
                                            key={item.id}
                                            href={`/knowledge/${item.id}`}
                                            className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
                                        >
                                            <div>
                                                <h3 className="font-medium text-primary hover:underline">{item.title}</h3>
                                                <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                    <span>{tk(`types.${item.type}`)}</span>
                                                    <span>•</span>
                                                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status]}`}>
                                                {tk(`statuses.${item.status}`)}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* QR Code Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center text-center">
                        <h3 className="font-semibold mb-4">Machine QR Code</h3>
                        <div id="qr-print-zone" className="bg-white p-4 rounded-xl border shadow-inner mb-4">
                            <QRCode value={qrUrl} size={180} className="w-full h-auto" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 px-2">
                            Scan this code with any device to instantly access this machine's profile and maintenance history.
                        </p>
                        <button
                            onClick={() => window.print()}
                            className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print QR Label
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #qr-print-zone, #qr-print-zone * {
                        visibility: visible;
                    }
                    #qr-print-zone {
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        border: none !important;
                        box-shadow: none !important;
                        width: 100mm;
                        height: 100mm;
                    }
                }
            `}</style>
        </div>
    );
}
