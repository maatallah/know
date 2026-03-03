'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGapPage() {
    const t = useTranslations('gaps');
    const tc = useTranslations('common');
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const res = await fetch('/api/gaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description }),
        });

        if (res.ok) {
            const gap = await res.json();
            router.push(`/gaps/${gap.id}`);
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to submit');
        }
        setLoading(false);
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('submitNew')}</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                        {t('gapTitle')} <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        minLength={3}
                        className="input-field"
                        placeholder={t('gapTitlePlaceholder')}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                        {t('gapDescription')} <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minLength={10}
                        rows={5}
                        className="input-field min-h-[120px]"
                        placeholder={t('gapDescriptionPlaceholder')}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {loading ? tc('loading') : t('submit')}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                    >
                        {tc('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
