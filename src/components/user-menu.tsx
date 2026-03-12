'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { usePermissions, clearPermissionsCache } from '@/lib/usePermissions';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';

export function UserMenu() {
    const t = useTranslations('common');
    const { user, loading } = usePermissions();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading || !user || !user.authenticated) return null;

    // Generate initials for avatar fallback
    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user.email.substring(0, 2).toUpperCase();

    // Pretty format role
    const formattedRole = user.role.replace('_', ' ');

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {initials}
                </div>
                <span className="text-sm font-medium hidden sm:inline-block">
                    {user.name || user.email.split('@')[0]}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 p-1 rounded-xl border border-border bg-card shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-border/50">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {formattedRole}
                            </span>
                            {user.department && (
                                <span className="inline-flex items-center rounded-md bg-secondary/20 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                                    {user.department}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-1">
                        <Link
                            href="/settings/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                        >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            {t('profile') || 'My Profile'}
                        </Link>
                    </div>

                    <div className="border-t border-border/50 p-1">
                        <button
                            onClick={async () => {
                                clearPermissionsCache();
                                await signOut({ callbackUrl: '/login' });
                                window.location.href = '/login'; // Force hard reload to guarantee cache wipe
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            {t('logout') || 'Log out'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
