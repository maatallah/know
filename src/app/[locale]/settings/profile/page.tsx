'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/lib/usePermissions';
import { User, Mail, Shield, Building, Settings, Check, Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';

export default function ProfileSettingsPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const { user, loading } = usePermissions();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const [form, setForm] = useState({ name: '', locale: 'en', theme: 'system' });
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                locale: user.locale || pathname.split('/')[1] || 'en',
                theme: user.theme || theme || 'system'
            });
        }
    }, [user, theme, pathname]);

    if (loading || !user) {
        return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');

        try {
            const res = await fetch('/api/me/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setSuccessMsg(tc('save') + ' \u2714'); // Add a checkmark

                // If locale changed, we need to force reload to the new path
                const currentLocale = pathname.split('/')[1];
                if (form.locale !== currentLocale) {
                    const newPath = pathname.replace(`/${currentLocale}`, `/${form.locale}`);
                    window.location.href = newPath;
                    return; // Stop execution, browser is redirecting
                }

                // If theme changed, apply it via next-themes
                if (form.theme !== theme) {
                    setTheme(form.theme);
                }
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setSaving(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{tc('profile') || 'My Profile'}</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Read-only System Info */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            System Account
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground">{tc('email') || 'Email'}</label>
                                <div className="flex items-center gap-2 mt-1 font-medium bg-accent/50 p-2 rounded-lg">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {user.email}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground">{tc('role') || 'Role'}</label>
                                    <div className="flex items-center gap-2 mt-1 font-medium bg-accent/50 p-2 rounded-lg text-primary">
                                        {user.role}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">{tc('department')}</label>
                                    <div className="flex items-center gap-2 mt-1 font-medium bg-accent/50 p-2 rounded-lg">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        {user.department || '-'}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-4">
                                Note: Your email, role, and department are controlled by system administrators.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Editable Profile Settings */}
                <div className="space-y-6">
                    <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Preferences
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{tc('name') || 'Full Name'}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="input-field pl-9"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    Language
                                </label>
                                <select
                                    value={form.locale}
                                    onChange={(e) => setForm({ ...form, locale: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="en">English (US)</option>
                                    <option value="fr">Français (France)</option>
                                    <option value="ar">العربية (Arabic)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                                    <Moon className="h-4 w-4 text-muted-foreground" />
                                    Theme
                                </label>
                                <select
                                    value={form.theme}
                                    onChange={(e) => setForm({ ...form, theme: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="system">System Default</option>
                                    <option value="light">Light Mode</option>
                                    <option value="dark">Dark Mode</option>
                                </select>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : tc('save')}
                                </button>
                                {successMsg && (
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">
                                        <Check className="h-4 w-4" /> Saved!
                                    </span>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
