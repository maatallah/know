'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, Eye, Clock, Shield, AlertTriangle, Paperclip, Download, Trash2, Copy, FilePlus,
    Camera, Video, FileText, Music, FileDown, Building2, Settings2, User, Wrench,
    ClipboardList, CheckCircle2, Tag
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { usePermissions } from '@/lib/usePermissions';
import ReactMarkdown from 'react-markdown';
import { CameraRecorderModal } from '@/components/camera-recorder-modal';
import { ConfirmModal } from '@/components/confirm-modal';

interface KnowledgeDetail {
    id: string;
    title: string;
    shortDescription: string | null;
    type: string;
    riskLevel: string;
    criticalityLevel: string;
    estimatedTimeMin: number | null;
    requiredTools: string | null;
    preconditions: string | null;
    expectedOutcome: string | null;
    status: string;
    viewCount: number;
    healthScore: number;
    effectiveDate: string | null;
    expiryDate: string | null;
    owner: { id: string; name: string | null };
    department: { id: string; name: string };
    machine: { id: string; name: string } | null;
    category: { id: string; name: string } | null;
    tags: { id: string; name: string }[];
    versions: {
        id: string;
        versionNumber: number;
        content: string;
        status: string;
        approvalComment: string | null;
        author: { id: string; name: string | null };
        createdAt: string;
    }[];
    comments: {
        id: string;
        content: string;
        user: { id: string; name: string | null };
        createdAt: string;
    }[];
}

const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

export default function KnowledgeDetailPage() {
    const t = useTranslations('knowledge');
    const tc = useTranslations('common');
    const { can } = usePermissions();
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<KnowledgeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [attachments, setAttachments] = useState<{ id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number; downloadCount: number }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title?: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' | 'default'; confirmText?: string }>({
        isOpen: false,
        message: '',
        onConfirm: () => { }
    });

    const id = params.id as string;

    useEffect(() => {
        fetch(`/api/knowledge/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) setItem(null);
                else setItem(data);
            })
            .finally(() => setLoading(false));
        fetch(`/api/knowledge/${id}/attachments`)
            .then((r) => r.json())
            .then((data) => setAttachments(data || []))
            .catch(() => { });
    }, [id]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement> | File) {
        const file = 'target' in e ? e.target.files?.[0] : e;
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`/api/knowledge/${id}/attachments`, { method: 'POST', body: formData });
        if (res.ok) {
            const att = await res.json();
            setAttachments((prev) => [att, ...prev]);
        }
        setUploading(false);
        if ('target' in e) e.target.value = '';
    }

    async function handleDeleteAttachment(fileUrl: string) {
        setConfirmConfig({
            isOpen: true,
            title: tc('confirm'),
            message: t('confirmDeleteAttachment'),
            confirmText: tc('delete'),
            variant: 'danger',
            onConfirm: async () => {
                const filename = fileUrl.split('/').pop();
                await fetch(`/api/attachments/${filename}`, { method: 'DELETE' });
                setAttachments((prev) => prev.filter((a) => a.fileUrl !== fileUrl));
            }
        });
    }

    async function handleWorkflow(action: string) {
        if (action === 'archive') {
            setConfirmConfig({
                isOpen: true,
                title: tc('confirm'),
                message: t('confirmArchive'),
                confirmText: t('archive'),
                variant: 'danger',
                onConfirm: async () => {
                    setActionLoading(true);
                    const res = await fetch(`/api/knowledge/${id}/workflow`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                        const fresh = await fetch(`/api/knowledge/${id}`);
                        setItem(await fresh.json());
                        setComment('');
                    } else {
                        alert(data.error);
                    }
                    setActionLoading(false);
                }
            });
            return;
        }

        if (action === 'approve' && !comment.trim()) {
            alert(t('approvalCommentRequired') || 'Approval comment is mandatory');
            return;
        }
        setActionLoading(true);
        const res = await fetch(`/api/knowledge/${id}/workflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, comment: comment.trim() || undefined }),
        });
        const data = await res.json();
        if (res.ok) {
            // Refresh
            const fresh = await fetch(`/api/knowledge/${id}`);
            setItem(await fresh.json());
            setComment('');
        } else {
            alert(data.error);
        }
        setActionLoading(false);
    }

    async function handleDuplicate() {
        setConfirmConfig({
            isOpen: true,
            title: tc('confirm'),
            message: t('confirmDuplicate') || 'Duplicate this procedure?',
            confirmText: t('duplicate'),
            variant: 'default',
            onConfirm: async () => {
                setActionLoading(true);
                const res = await fetch(`/api/knowledge/${id}/duplicate`, { method: 'POST' });
                if (res.ok) {
                    const newItem = await res.json();
                    router.push(`/knowledge/${newItem.id}`);
                } else {
                    alert(t('failedToDuplicate') || 'Failed to duplicate');
                    setActionLoading(false);
                }
            }
        });
    }

    async function handleNewVersion() {
        setConfirmConfig({
            isOpen: true,
            title: tc('confirm'),
            message: t('confirmNewVersion') || 'Create a new draft version?',
            confirmText: t('createNewVersion'),
            variant: 'default',
            onConfirm: async () => {
                setActionLoading(true);
                const res = await fetch(`/api/knowledge/${id}/version`, { method: 'POST' });
                if (res.ok) {
                    const fresh = await fetch(`/api/knowledge/${id}`);
                    setItem(await fresh.json());
                } else {
                    const data = await res.json();
                    alert(data.error || t('failedToCreateVersion') || 'Failed to create new version');
                }
                setActionLoading(false);
            }
        });
    }

    async function handlePdfExport() {
        window.print();
    }

    if (loading) return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    if (!item) return <div className="py-12 text-center text-muted-foreground">Not found</div>;

    const latestVersion = item.versions[0];

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-20">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 20mm; }
                    body { background: white !important; color: black !important; }
                    .print-hidden { display: none !important; }
                    #knowledge-content-pdf-zone { background: white !important; color: black !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .markdown-content * { color: black !important; }
                    .MetaCard, .InfoRow, .bg-card { background: white !important; border-color: #eee !important; color: black !important; }
                }
            `}</style>
            
            {/* Back + Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="rounded-xl border border-border/50 bg-card p-2.5 hover:bg-accent transition-all hover:scale-105 active:scale-95 shadow-sm group print:hidden"
                    >
                        <ArrowLeft className="h-5 w-5 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">{item.title}</h1>
                            <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm', statusColors[item.status])}>
                                {t(`statuses.${item.status}`)}
                            </span>
                        </div>
                        {item.shortDescription && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.shortDescription}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 print:hidden">
                    {can('knowledge.create') && (
                        <button
                            title={t('duplicate')}
                            onClick={handleDuplicate}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            <Copy className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('duplicate')}</span>
                        </button>
                    )}
                    {(item.status === 'APPROVED' || item.status === 'ARCHIVED') && can('knowledge.create') && (
                        <button
                            title={t('createNewVersion')}
                            onClick={handleNewVersion}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            <FilePlus className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('createNewVersion')}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                    {/* Metadata Grid */}
                    <div id="knowledge-content-pdf-zone" className="space-y-6 bg-background rounded-2xl p-0 print:bg-white print:text-black">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <MetaCard icon={<Shield className="h-4 w-4" />} label={t('riskLevel')} value={t(`riskLevels.${item.riskLevel}`)} variant={item.riskLevel === 'HIGH' ? 'danger' : 'default'} />
                            <MetaCard icon={<AlertTriangle className="h-4 w-4" />} label={t('criticality')} value={t(`criticalityLevels.${item.criticalityLevel}`)} variant={item.criticalityLevel === 'CRITICAL' ? 'warning' : 'default'} />
                            <MetaCard icon={<Clock className="h-4 w-4" />} label={t('type')} value={t(`types.${item.type}`)} />
                            <MetaCard icon={<Eye className="h-4 w-4" />} label={t('viewCount')} value={String(item.viewCount)} />
                        </div>

                        {/* Extra metadata */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label={t('department')} value={item.department.name} />
                            {item.machine && <InfoRow icon={<Settings2 className="h-3.5 w-3.5" />} label={t('machine')} value={item.machine.name} />}
                            {item.owner.name && <InfoRow icon={<User className="h-3.5 w-3.5" />} label={t('owner')} value={item.owner.name} />}
                            {item.requiredTools && <InfoRow icon={<Wrench className="h-3.5 w-3.5" />} label={t('requiredTools')} value={item.requiredTools} />}
                            {item.preconditions && <InfoRow icon={<ClipboardList className="h-3.5 w-3.5" />} label={t('preconditions')} value={item.preconditions} />}
                            {item.expectedOutcome && <InfoRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} label={t('expectedOutcome')} value={item.expectedOutcome} />}
                        </div>

                        {/* Content */}
                        {latestVersion && (
                            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm print:shadow-none print:border-black/20">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
                                <div className="relative p-6 sm:p-8">
                                    <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
                                        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground/80">
                                            <FileText className="h-5 w-5 text-primary/70" />
                                            {t('version')} {latestVersion.versionNumber}
                                        </h2>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-foreground/70">{latestVersion.author.name}</p>
                                            <p className="text-[10px] text-muted-foreground/50">{new Date(latestVersion.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-medium markdown-content">
                                        <ReactMarkdown>
                                            {(latestVersion.content || '').replace(/\\n/g, '\n')}
                                        </ReactMarkdown>
                                    </div>
                                    {latestVersion.approvalComment && (
                                        <div className="mt-8 rounded-xl bg-green-500/5 border border-green-500/20 p-4 flex gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-1">{t('approval')}</p>
                                                <p className="text-sm font-medium text-green-800/80">{latestVersion.approvalComment}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Workflow Actions */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between print:hidden">
                            <h2 className="text-base font-bold flex items-center gap-2.5 text-foreground/80">
                                <Shield className="h-5 w-5 text-primary/70" />
                                {t('workflow')}
                            </h2>
                            <button
                                onClick={handlePdfExport}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-xs font-bold hover:bg-accent transition-all shadow-sm"
                            >
                                <FileDown className="h-4 w-4" />
                                <span>{tc('exportPdf')}</span>
                            </button>
                        </div>

                        <div className="grid gap-4 print:hidden">
                            {item.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleWorkflow('submit-review')}
                                    disabled={actionLoading}
                                    className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                >
                                    {t('submitReview')}
                                </button>
                            )}

                            {item.status === 'IN_REVIEW' && (
                                <div className="space-y-4 max-w-2xl">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder={t('approvalCommentPlaceholder') || "Type your approval comments here (required)..."}
                                        className="w-full min-h-[100px] rounded-xl border-border/50 bg-background/50 p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all outline-none"
                                    />
                                    <button
                                        onClick={() => handleWorkflow('approve')}
                                        disabled={actionLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-600/20"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {t('approve')}
                                    </button>
                                </div>
                            )}

                            {item.status === 'APPROVED' && (
                                <button
                                    onClick={() => handleWorkflow('archive')}
                                    disabled={actionLoading}
                                    className="w-full sm:w-auto rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
                                >
                                    {t('archive')}
                                </button>
                            )}

                            {item.status === 'ARCHIVED' && (
                                <div className="rounded-xl bg-muted/40 p-4 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">{t('archivedNotice')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Attachments & Tags */}
                <div className="space-y-6 print:hidden">
                    {/* Attachments */}
                    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/80">
                                <Paperclip className="h-4 w-4 text-primary/70" />
                                {tc('attachments')}
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded ml-1">{attachments.length}</span>
                            </h2>
                        </div>

                        {item.status !== 'ARCHIVED' && (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsCameraOpen(true)}
                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/20 transition-all group"
                                >
                                    <Camera className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">{tc('capture')}</span>
                                </button>
                                <label className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/20 transition-all group cursor-pointer">
                                    <FilePlus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">{uploading ? tc('uploading') : tc('upload')}</span>
                                    <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                                </label>
                            </div>
                        )}

                        <div className="space-y-3">
                            {attachments.length === 0 ? (
                                <p className="text-[11px] text-center py-4 text-muted-foreground/40 italic font-medium">{t('noMediaAttached')}</p>
                            ) : (
                                attachments.map((att) => (
                                    <div key={att.id} className="group relative overflow-hidden rounded-xl border border-border/50 bg-muted/20 hover:bg-background transition-all">
                                        <div className="p-3 flex items-center gap-3">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-background border border-border/50 flex items-center justify-center">
                                                {att.fileType === 'IMAGE' ? <Camera className="w-5 h-5 text-blue-500/70" /> :
                                                    att.fileType === 'VIDEO' ? <Video className="w-5 h-5 text-red-500/70" /> :
                                                        att.fileType === 'AUDIO' ? <Music className="w-5 h-5 text-yellow-500/70" /> :
                                                            <FileText className="w-5 h-5 text-gray-500/70" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold truncate pr-6" title={att.fileName}>{att.fileName}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase">
                                                    {(att.fileSize / 1024).toFixed(0)} KB • {att.downloadCount} DL
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={att.fileUrl} target="_blank" className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-all">
                                                    <Download className="h-3.5 w-3.5" />
                                                </a>
                                                {item.status !== 'ARCHIVED' && (
                                                    <button onClick={() => handleDeleteAttachment(att.fileUrl)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-all">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Optional image preview (small) */}
                                        {att.fileType === 'IMAGE' && (
                                            <div className="h-1 bg-primary/20 w-0 group-hover:w-full transition-all duration-500" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground/80 mb-4">
                                <Tag className="h-4 w-4 text-primary/70" />
                                {t('tags')}
                            </h2>
                            <div className="flex flex-wrap gap-1.5 font-bold">
                                {item.tags.map((tag) => (
                                    <span key={tag.id} className="rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary/70 hover:bg-primary/10 transition-colors">
                                        #{tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CameraRecorderModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onUpload={handleUpload}
            />

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

function MetaCard({ icon, label, value, variant = 'default' }: { icon: React.ReactNode; label: string; value: string; variant?: 'default' | 'danger' | 'warning' }) {
    const variants = {
        default: 'border-border/50 bg-card text-foreground/80',
        danger: 'border-destructive/20 bg-destructive/5 text-destructive',
        warning: 'border-orange-500/20 bg-orange-500/5 text-orange-600'
    };

    return (
        <div className={cn('rounded-2xl border p-5 shadow-sm transition-all hover:scale-[1.02]', variants[variant])}>
            <div className="flex items-center gap-2 opacity-60">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 group hover:bg-card transition-all">
            <div className="flex items-center gap-2 mb-1">
                {icon && <span className="text-muted-foreground/50">{icon}</span>}
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
            </div>
            <p className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">{value}</p>
        </div>
    );
}
