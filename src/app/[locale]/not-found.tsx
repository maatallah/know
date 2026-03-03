import { Link } from '@/i18n/routing';

export default function NotFound() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="text-6xl font-bold text-muted-foreground/30">404</div>
            <h2 className="text-xl font-semibold">Page not found</h2>
            <p className="text-sm text-muted-foreground max-w-md">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                href="/"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                Back to Dashboard
            </Link>
        </div>
    );
}
