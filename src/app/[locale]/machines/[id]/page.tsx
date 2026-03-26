'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { ArrowLeft, Settings2, Calendar, FileText, Printer, Pencil, Trash2, Copy, Check, X, FilePlus, FileSpreadsheet } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { usePermissions } from '@/lib/usePermissions';
import { ConfirmModal } from '@/components/confirm-modal';
import * as XLSX from 'xlsx';

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
    const [kbActionLoading, setKbActionLoading] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', serialNumber: '', departmentId: '' });
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title?: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' | 'default'; confirmText?: string }>({
        isOpen: false,
        message: '',
        onConfirm: () => { }
    });

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

    async function handleDuplicateKB(itemId: string) {
        setConfirmConfig({
            isOpen: true,
            title: tc('confirm'),
            message: tk('confirmDuplicate') || 'Duplicate this procedure?',
            confirmText: tk('duplicate'),
            variant: 'default',
            onConfirm: async () => {
                setKbActionLoading(itemId);
                const res = await fetch(`/api/knowledge/${itemId}/duplicate`, { method: 'POST' });
                if (res.ok) {
                    const newItem = await res.json();
                    router.push(`/knowledge/${newItem.id}`);
                } else {
                    alert(t('failedToDuplicate') || 'Failed to duplicate');
                    setKbActionLoading(null);
                }
            }
        });
    }

    async function handleNewVersionKB(itemId: string) {
        setConfirmConfig({
            isOpen: true,
            title: tc('confirm'),
            message: tk('confirmNewVersion') || 'Create a new draft version?',
            confirmText: tk('createNewVersion'),
            variant: 'default',
            onConfirm: async () => {
                setKbActionLoading(itemId);
                const res = await fetch(`/api/knowledge/${itemId}/version`, { method: 'POST' });
                if (res.ok) {
                    const fresh = await fetch(`/api/machines/${id}`);
                    setMachine(await fresh.json());
                } else {
                    const data = await res.json();
                    alert(data.error || t('failedToCreateVersion') || 'Failed to create new version');
                }
                setKbActionLoading(null);
            }
        });
    }

    async function handleDelete() {
        setConfirmConfig({
            isOpen: true,
            title: tc('confirm'),
            message: t('deleteMachine'),
            confirmText: tc('delete'),
            variant: 'danger',
            onConfirm: async () => {
                const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    const locale = window.location.pathname.split('/')[1];
                    window.location.href = `/${locale}/machines`;
                } else {
                    const err = await res.json();
                    alert(err.error);
                }
            }
        });
    }

    async function handleDuplicate() {
        if (!machine) return;
        const res = await fetch('/api/machines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `${machine.name} (Copy)`,
                serialNumber: '',
                departmentId: machine.departmentId,
            }),
        });
        if (res.ok) {
            const created = await res.json();
            // Use window.location for reliable navigation with locale
            const locale = window.location.pathname.split('/')[1]; // e.g. "fr", "en", "ar"
            window.location.href = `/${locale}/machines/${created.id}`;
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to duplicate');
        }
    }

    async function handleExcelExport() {
        if (!machine) return;

        const wsData: any[][] = [
            ['Machine History Export'],
            ['Machine Name', machine.name],
            ['Serial Number', machine.serialNumber || 'N/A'],
            ['Department', machine.department.name],
            ['Export Date', new Date().toLocaleDateString()],
            [],
            ['Title', 'Type', 'Status', 'Last Updated']
        ];

        machine.knowledgeItems.forEach(item => {
            wsData.push([
                item.title,
                tk(`types.${item.type}`),
                tk(`statuses.${item.status}`),
                new Date(item.updatedAt).toLocaleDateString()
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws, 'History');
        XLSX.writeFile(wb, `${machine.name.replace(/\s+/g, '_')}_History.xlsx`);
    }

    if (loading) {
        return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    }

    if (!machine) {
        return <div className="py-12 text-center text-destructive">{t('notFound')}</div>;
    }

    const qrUrl = `${domain}/machines/${machine.id}`;

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-12">
            {/* Top bar: Back + Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    {tc('back')}
                </button>

                <div className="flex items-center gap-2">
                    {can('machines.create') && (
                        <button
                            title={t('duplicateMachine')}
                            onClick={handleDuplicate}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-4 py-2 text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                        >
                            <Copy className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('duplicateMachine')}</span>
                        </button>
                    )}
                    {can('machines.edit') && !editing && (
                        <button
                            onClick={startEdit}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                        >
                            <Pencil className="h-4 w-4" />
                            {tc('edit')}
                        </button>
                    )}
                    {can('machines.delete') && (
                        <button
                            title={tc('delete')}
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">{tc('delete')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Profile Card */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                        {/* Premium Header Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

                        <div className="relative p-6 sm:p-8">
                            {editing ? (
                                /* ── Inline Edit Form ── */
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold tracking-tight">{tc('edit')} — {machine.name}</h2>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/10"
                                            >
                                                {saving ? tc('loading') : <><Check className="h-4 w-4 inline-block me-1" /> {tc('save')}</>}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm font-bold hover:bg-accent transition-all"
                                            >
                                                <X className="h-4 w-4 inline-block me-1" /> {tc('cancel')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">{t('machineName')}</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">{t('serialNumberOptional')}</label>
                                            <input
                                                type="text"
                                                value={form.serialNumber}
                                                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                                                className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">{tc('department')}</label>
                                            <select
                                                value={form.departmentId}
                                                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                                className="w-full rounded-xl border-border/50 bg-background/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                                            >
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── View Mode ── */
                                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                                        <Settings2 className="h-10 w-10" />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{machine.department.name}</p>
                                            <h1 className="text-3xl font-bold tracking-tight text-foreground/90">{machine.name}</h1>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{t('serialNumberOptional')}</dt>
                                                <dd className="text-sm font-bold text-foreground/80">{machine.serialNumber || '—'}</dd>
                                            </div>
                                            <div className="space-y-1">
                                                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{tc('createdAt')}</dt>
                                                <dd className="text-sm font-bold text-foreground/80 flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                    {new Date(machine.createdAt).toLocaleDateString()}
                                                </dd>
                                            </div>
                                            <div className="space-y-1 hidden sm:block">
                                                <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{tc('systemId')}</dt>
                                                <dd className="text-[11px] font-mono text-muted-foreground/70 truncate" title={machine.id}>{machine.id.slice(0, 8)}...</dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border/50 bg-muted/20 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-base font-bold flex items-center gap-2.5 text-foreground/80">
                                <FileText className="h-5 w-5 text-primary/70" />
                                {t('knowledgeHistory')}
                            </h2>
                            {machine.knowledgeItems.length > 0 && (
                                <button
                                    onClick={handleExcelExport}
                                    className="inline-flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-1.5 text-xs font-bold text-green-600 hover:bg-green-500/10 transition-all"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span>{tc('exportXlsx')}</span>
                                </button>
                            )}
                        </div>
                        <div className="p-0">
                            {machine.knowledgeItems.length === 0 ? (
                                <div className="p-20 text-center space-y-2 bg-card/10">
                                    <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground/50">
                                        {t('noHistory')}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {machine.knowledgeItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="group flex items-center justify-between p-4 px-6 hover:bg-primary/5 transition-all"
                                        >
                                            <Link href={`/knowledge/${item.id}`} className="flex-1 block">
                                                <h3 className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">{item.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{tk(`types.${item.type}`)}</span>
                                                    <span className="text-muted-foreground/30">•</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/60">{new Date(item.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-4">
                                                <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border', statusColors[item.status])}>
                                                    {tk(`statuses.${item.status}`)}
                                                </span>
                                                {can('knowledge.create') && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDuplicateKB(item.id)}
                                                            disabled={kbActionLoading === item.id}
                                                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-card border border-transparent hover:border-border/50 transition-all text-muted-foreground hover:text-primary"
                                                            title={tk('duplicate')}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        {(item.status === 'APPROVED' || item.status === 'ARCHIVED') && (
                                                            <button
                                                                onClick={() => handleNewVersionKB(item.id)}
                                                                disabled={kbActionLoading === item.id}
                                                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-card border border-transparent hover:border-border/50 transition-all text-muted-foreground hover:text-primary"
                                                                title={tk('createNewVersion')}
                                                            >
                                                                <FilePlus className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* QR Code Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm flex flex-col items-center text-center">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{t('qrCodeTitle')}</h3>
                        <div id="qr-print-zone" className="bg-white p-5 rounded-2xl border border-border shadow-inner mb-6 w-full aspect-square flex items-center justify-center">
                            <QRCode value={qrUrl} size={180} className="w-full h-auto" />
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed mb-6 px-2">
                            {t('qrCodeDesc')}
                        </p>
                        <button
                            onClick={() => window.print()}
                            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
                        >
                            <Printer className="h-4 w-4" />
                            {t('printQr')}
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

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                confirmText={confirmConfig.confirmText}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
