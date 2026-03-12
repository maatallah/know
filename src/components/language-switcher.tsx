'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePermissions } from '@/lib/usePermissions';
import { cn } from '@/lib/utils';

const localeLabels: Record<string, string> = {
    ar: 'العربية',
    fr: 'Français',
    en: 'English',
};

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const { user } = usePermissions();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function switchLocale(newLocale: string) {
        if (user?.authenticated && newLocale !== locale) {
            fetch('/api/me/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: newLocale })
            }).catch(console.error);
        }

        router.replace(pathname, { locale: newLocale as 'ar' | 'fr' | 'en' });
        setOpen(false);
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                aria-label="Switch language"
            >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{localeLabels[locale]}</span>
            </button>

            {open && (
                <div className="absolute end-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                    {Object.entries(localeLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => switchLocale(key)}
                            className={cn(
                                'flex w-full items-center px-3 py-2 text-sm transition-colors',
                                key === locale
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-accent'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
