'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { usePermissions } from '@/lib/usePermissions';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Cog,
    Users,
    Building2,
    AlertTriangle,
    ClipboardList,
    X,
} from 'lucide-react';

const navItems = [
    { key: 'dashboard', href: '/', icon: LayoutDashboard },
    { key: 'knowledge', href: '/knowledge', icon: BookOpen },
    { key: 'machines', href: '/machines', icon: Cog },
    { key: 'departments', href: '/departments', icon: Building2 },
    { key: 'gaps', href: '/gaps', icon: AlertTriangle },
    { key: 'users', href: '/users', icon: Users },
    { key: 'audit', href: '/audit', icon: ClipboardList },
] as const;

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const { can, user, loading } = usePermissions();

    const allowedItems = navItems.filter(item => {
        if (item.key === 'users') return can('users.create');
        if (item.key === 'audit') return can('audit.view');
        return true;
    });

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-border bg-card transition-transform duration-300 md:static md:!translate-x-0 print:hidden',
                    open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                            K
                        </div>
                        <span className="text-xl font-bold tracking-tight">Know</span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 hover:bg-accent md:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {loading ? (
                        <div className="animate-pulse space-y-4 p-4">
                            <div className="h-8 bg-muted rounded w-3/4"></div>
                            <div className="h-8 bg-muted rounded w-1/2"></div>
                            <div className="h-8 bg-muted rounded w-2/3"></div>
                        </div>
                    ) : (
                        allowedItems.map((item) => {
                            const isActive =
                                item.href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    <span>{t(item.key)}</span>
                                </Link>
                            );
                        })
                    )}
                </nav>
            </aside>
        </>
    );
}
