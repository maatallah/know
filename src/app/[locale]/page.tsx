import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export default function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    return <DashboardPlaceholder />;
}

function DashboardPlaceholder() {
    const t = useTranslations('dashboard');
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {(['totalItems', 'inReview', 'expiredItems', 'gapsSubmitted'] as const).map((key) => (
                    <div
                        key={key}
                        className="rounded-xl border border-border bg-card p-6 shadow-sm"
                    >
                        <p className="text-sm font-medium text-muted-foreground">{t(key)}</p>
                        <p className="mt-2 text-3xl font-bold">0</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
