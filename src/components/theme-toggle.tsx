'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/lib/usePermissions';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const { user } = usePermissions();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <button className="rounded-lg p-2 hover:bg-accent" aria-label="Toggle theme">
                <Sun className="h-5 w-5" />
            </button>
        );
    }

    async function handleToggle() {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        if (user?.authenticated) {
            fetch('/api/me/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme })
            }).catch(console.error);
        }
    }

    return (
        <button
            onClick={handleToggle}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </button>
    );
}
