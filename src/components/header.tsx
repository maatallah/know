'use client';

import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const t = useTranslations('common');

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="rounded-lg p-2 hover:bg-accent md:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <div className="ml-2 pl-2 border-l border-border h-6 flex items-center">
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
