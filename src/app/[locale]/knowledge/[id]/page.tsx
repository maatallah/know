'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Eye, Clock, Shield, AlertTriangle, Paperclip, Download, Trash2, Copy, FilePlus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { usePermissions } from '@/lib/usePermissions';
import ReactMarkdown from 'react-markdown';

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

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
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
        e.target.value = '';
    }

    async function handleDeleteAttachment(fileUrl: string) {
        const filename = fileUrl.split('/').pop();
        await fetch(`/api/attachments/${filename}`, { method: 'DELETE' });
        setAttachments((prev) => prev.filter((a) => a.fileUrl !== fileUrl));
    }

    async function handleWorkflow(action: string) {
        if (action === 'approve' && !comment.trim()) {
            alert('Approval comment is mandatory');
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
        if (!confirm(t('confirmDuplicate') || 'Duplicate this procedure?')) return;
        setActionLoading(true);
        const res = await fetch(`/api/knowledge/${id}/duplicate`, { method: 'POST' });
        if (res.ok) {
            const newItem = await res.json();
            router.push(`/knowledge/${newItem.id}`);
        } else {
            alert('Failed to duplicate');
            setActionLoading(false);
        }
    }

    async function handleNewVersion() {
        if (!confirm(t('confirmNewVersion') || 'Create a new draft version?')) return;
        setActionLoading(true);
        const res = await fetch(`/api/knowledge/${id}/version`, { method: 'POST' });
        if (res.ok) {
            const fresh = await fetch(`/api/knowledge/${id}`);
            setItem(await fresh.json());
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to create new version');
        }
        setActionLoading(false);
    }

    if (loading) return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    if (!item) return <div className="py-12 text-center text-muted-foreground">Not found</div>;

    const latestVersion = item.versions[0];

    return (
        <div className="space-y-6">
            {/* Back + Title */}
            <div className="flex items-start gap-4">
                <button onClick={() => window.history.back()} className="mt-1 rounded-lg p-2 hover:bg-accent transition-colors">
                    <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
                </button>
                <div className="flex-1 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold">{item.title}</h1>
                            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusColors[item.status])}>
                                {t(`statuses.${item.status}`)}
                            </span>
                        </div>
                        {item.shortDescription && (
                            <p className="mt-1 text-muted-foreground">{item.shortDescription}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {can('knowledge.create') && (
                            <button
                                onClick={handleDuplicate}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                                title={t('duplicate')}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('duplicate')}</span>
                            </button>
                        )}
                        {(item.status === 'APPROVED' || item.status === 'ARCHIVED') && can('knowledge.create') && (
                            <button
                                onClick={handleNewVersion}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                title={t('createNewVersion')}
                            >
                                <FilePlus className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('createNewVersion')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetaCard icon={<Shield className="h-4 w-4" />} label={t('riskLevel')} value={t(`riskLevels.${item.riskLevel}`)} />
                <MetaCard icon={<AlertTriangle className="h-4 w-4" />} label={t('criticality')} value={t(`criticalityLevels.${item.criticalityLevel}`)} />
                <MetaCard icon={<Clock className="h-4 w-4" />} label={t('type')} value={t(`types.${item.type}`)} />
                <MetaCard icon={<Eye className="h-4 w-4" />} label={t('viewCount')} value={String(item.viewCount)} />
            </div>

            {/* Extra metadata */}
            <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label={t('department')} value={item.department.name} />
                {item.machine && <InfoRow label={t('machine')} value={item.machine.name} />}
                {item.owner.name && <InfoRow label={t('owner')} value={item.owner.name} />}
                {item.requiredTools && <InfoRow label={t('requiredTools')} value={item.requiredTools} />}
                {item.preconditions && <InfoRow label={t('preconditions')} value={item.preconditions} />}
                {item.expectedOutcome && <InfoRow label={t('expectedOutcome')} value={item.expectedOutcome} />}
            </div>

            {/* Content */}
            {latestVersion && (
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{t('version')} {latestVersion.versionNumber}</h2>
                        <span className="text-sm text-muted-foreground">
                            {latestVersion.author.name}
                        </span>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>
                            {(latestVersion.content || '').replace(/\\n/g, '\n')}
                        </ReactMarkdown>
                    </div>
                    {latestVersion.approvalComment && (
                        <div className="mt-4 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-3 text-sm">
                            <strong>{t('approval')}:</strong> {latestVersion.approvalComment}
                        </div>
                    )}
                </div>
            )}

            {/* Workflow Actions */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t('workflow')}</h2>

                {item.status === 'DRAFT' && (
                    <button
                        onClick={() => handleWorkflow('submit-review')}
                        disabled={actionLoading}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {t('submitReview')}
                    </button>
                )}

                {item.status === 'IN_REVIEW' && (
                    <div className="space-y-3">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Approval comment (mandatory)..."
                            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <button
                            onClick={() => handleWorkflow('approve')}
                            disabled={actionLoading}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-green-50 hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {t('approve')}
                        </button>
                    </div>
                )}

                {item.status === 'APPROVED' && (
                    <button
                        onClick={() => handleWorkflow('archive')}
                        disabled={actionLoading}
                        className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
                    >
                        {t('archive')}
                    </button>
                )}

                {item.status === 'ARCHIVED' && (
                    <p className="text-sm text-muted-foreground">This item has been archived.</p>
                )}
            </div>

            {/* Attachments */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Paperclip className="h-4 w-4" /> {tc('attachments')} ({attachments.length})
                    </h2>
                    <label className="cursor-pointer rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors">
                        {uploading ? '...' : tc('uploadFile')}
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
                {attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attachments yet.</p>
                ) : (
                    <div className="space-y-2">
                        {attachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{att.fileType}</span>
                                    <div>
                                        <p className="text-sm font-medium">{att.fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(att.fileSize / 1024).toFixed(0)} KB · {att.downloadCount} {tc('downloads')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={att.fileUrl} target="_blank" className="p-1.5 rounded hover:bg-accent transition-colors">
                                        <Download className="h-4 w-4" />
                                    </a>
                                    <button onClick={() => handleDeleteAttachment(att.fileUrl)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-3">{t('tags')}</h2>
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                            <span key={tag.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium border border-border/50 text-secondary-foreground">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <p className="text-sm font-medium mt-0.5">{value}</p>
        </div>
    );
}
