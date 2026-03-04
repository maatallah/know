import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFound() {
    const tc = useTranslations('common');

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">{tc('notFound')}</h2>
            <p className="text-muted-foreground">{tc('notFoundDesc')}</p>
            <Link
                href="/"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                {tc('backToDashboard')}
            </Link>
        </div>
    );
}
