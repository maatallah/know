'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/lib/usePermissions';
import { User, Mail, Shield, Building, Settings, Check, Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ProfileSettingsPage() {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const ts = useTranslations('settings');
    const { user, loading: userLoading } = usePermissions();
    const { theme: currentTheme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const [form, setForm] = useState({ name: '', locale: 'en', theme: 'system' });
    const [originalForm, setOriginalForm] = useState({ name: '', locale: 'en', theme: 'system' });
    
    const [globalSettings, setGlobalSettings] = useState({ auditKeepLatest: '1000', auditMaxAgeDays: '90' });
    const [originalGlobalSettings, setOriginalGlobalSettings] = useState({ auditKeepLatest: '1000', auditMaxAgeDays: '90' });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (user) {
            const initialForm = {
                name: user.name || '',
                locale: user.locale || pathname.split('/')[1] || 'en',
                theme: user.theme || currentTheme || 'system'
            };
            setForm(initialForm);
            setOriginalForm(initialForm);

            if (user.role === 'SUPER_ADMIN') {
                setLoading(true);
                fetch('/api/settings')
                    .then(res => res.json())
                    .then(data => {
                        const initialGlobal = {
                            auditKeepLatest: String(data.auditKeepLatest || '1000'),
                            auditMaxAgeDays: String(data.auditMaxAgeDays || '90')
                        };
                        setGlobalSettings(initialGlobal);
                        setOriginalGlobalSettings(initialGlobal);
                    })
                    .catch(err => console.error('Failed to fetch settings', err))
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        }
    }, [user, currentTheme, pathname]);

    const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm) || 
                   (user?.role === 'SUPER_ADMIN' && JSON.stringify(globalSettings) !== JSON.stringify(originalGlobalSettings));

    if (userLoading || loading || !user) {
        return <div className="py-12 text-center text-muted-foreground">{tc('loading')}</div>;
    }

    function handleCancel() {
        setForm(originalForm);
        setGlobalSettings(originalGlobalSettings);
    }

    async function handleSaveAll() {
        setSaving(true);
        setSuccessMsg('');

        try {
            const updates = [];

            // Profile update if dirty
            if (JSON.stringify(form) !== JSON.stringify(originalForm)) {
                updates.push(fetch('/api/me/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update profile');
                    }
                    return res.json();
                }));
            }

            // Global settings update if dirty
            if (user.role === 'SUPER_ADMIN' && JSON.stringify(globalSettings) !== JSON.stringify(originalGlobalSettings)) {
                updates.push(fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(globalSettings)
                }).then(async res => {
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update global settings');
                    }
                    return res.json();
                }));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                setSuccessMsg(ts('saved'));
                setOriginalForm(form);
                setOriginalGlobalSettings(globalSettings);

                // If locale changed, we need to force reload to the new path
                const currentLocale = pathname.split('/')[1];
                if (form.locale !== currentLocale) {
                    const newPath = pathname.replace(`/${currentLocale}`, `/${form.locale}`);
                    window.location.href = newPath;
                    return;
                }

                // If theme changed, apply it via next-themes
                if (form.theme !== currentTheme) {
                    setTheme(form.theme);
                }
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || ts('errorOccurred'));
        } finally {
            setSaving(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-20">
            {/* Header with Sticky Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 border-b border-border/50 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-inner">
                            <Settings className="h-6 w-6" />
                        </div>
                        {ts('title')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{ts('manageProfileSubtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Cancel Button - Only when dirty */}
                    {isDirty && (
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-all hover:bg-muted/50 rounded-xl"
                        >
                            {tc('cancel')}
                        </button>
                    )}

                    {/* Consolidated Save Button */}
                    <button
                        onClick={handleSaveAll}
                        disabled={saving || !isDirty}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold transition-all shadow-lg active:scale-[0.98]",
                            isDirty 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02]" 
                                : "bg-muted text-muted-foreground shadow-none cursor-not-allowed grayscale-[0.5]"
                        )}
                    >
                        {saving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : <Check className="h-4 w-4" />}
                        {saving ? ts('saving') : tc('save')}
                    </button>

                    {successMsg && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow-2xl shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-1 rounded-full bg-white/20">
                                    <Check className="h-4 w-4" />
                                </div>
                                {successMsg}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                {/* Read-only System Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm overflow-hidden relative group">
                        <div className="absolute -right-6 -top-6 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <Shield className="h-32 w-32" />
                        </div>

                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-6 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary/60" />
                            {ts('systemAccount')}
                        </h2>

                        <div className="space-y-5 relative">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{tc('email')}</label>
                                <div className="flex items-center gap-3 bg-muted/30 border border-border/30 p-3 rounded-xl transition-colors group/item">
                                    <Mail className="h-4 w-4 text-muted-foreground/50 group-hover/item:text-primary/60 transition-colors" />
                                    <span className="text-sm font-bold text-foreground/80">{user.email}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{tc('role')}</label>
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs font-bold text-primary shadow-sm">
                                            <Shield className="h-3.5 w-3.5" />
                                            {user.role}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">{tc('department')}</label>
                                    <div className="flex items-center gap-3 bg-muted/30 border border-border/30 p-3 rounded-xl transition-colors group/item">
                                        <Building className="h-4 w-4 text-muted-foreground/50 group-hover/item:text-primary/60 transition-colors" />
                                        <span className="text-sm font-bold text-foreground/80">{user.department || tc('none')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50">
                                <p className="text-[11px] leading-relaxed text-muted-foreground/70 italic">
                                    {ts('noteAdmin')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Profile Settings */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                        <h2 className="relative text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-8 flex items-center gap-2">
                            <Settings className="h-4 w-4 text-primary/60" />
                            {ts('preferences')}
                        </h2>

                        <div className="space-y-6 relative">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground/70 ml-1">{tc('name')}</label>
                                <div className="relative group/input">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 text-sm font-bold rounded-xl border border-border/50 bg-muted/10 focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:outline-none transition-all placeholder:text-muted-foreground/30"
                                        placeholder={ts('namePlaceholder')}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/70 ml-1 flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        {ts('language')}
                                    </label>
                                    <select
                                        value={form.locale}
                                        onChange={(e) => setForm({ ...form, locale: e.target.value })}
                                        className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-border/50 bg-muted/10 focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="en">{ts('languages.en')}</option>
                                        <option value="fr">{ts('languages.fr')}</option>
                                        <option value="ar">{ts('languages.ar')}</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/70 ml-1 flex items-center gap-2">
                                        <Moon className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        {ts('theme')}
                                    </label>
                                    <select
                                        value={form.theme}
                                        onChange={(e) => setForm({ ...form, theme: e.target.value })}
                                        className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-border/50 bg-muted/10 focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="system">{ts('themes.system')}</option>
                                        <option value="light">{ts('themes.light')}</option>
                                        <option value="dark">{ts('themes.dark')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Global System Settings - Super Admin Only */}
                    {user.role === 'SUPER_ADMIN' && (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 shadow-sm relative overflow-hidden transition-all hover:bg-primary/[0.07]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                            
                            <h2 className="relative text-sm font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                {ts('systemSettings')}
                            </h2>
                            <p className="text-xs text-muted-foreground/70 mb-8 max-w-md">
                                {ts('globalSettingsDesc')}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-8 relative">
                                <div className="space-y-2.5">
                                    <label className="text-xs font-bold text-foreground/70 ml-1 block">
                                        {ts('auditKeepLatest')}
                                    </label>
                                    <input
                                        type="number"
                                        value={globalSettings.auditKeepLatest}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, auditKeepLatest: e.target.value })}
                                        className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-border/50 bg-background/50 focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground/60 leading-tight px-1 italic">
                                        {ts('auditKeepLatestHelp')}
                                    </p>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-xs font-bold text-foreground/70 ml-1 block">
                                        {ts('auditMaxAgeDays')}
                                    </label>
                                    <input
                                        type="number"
                                        value={globalSettings.auditMaxAgeDays}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, auditMaxAgeDays: e.target.value })}
                                        className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-border/50 bg-background/50 focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground/60 leading-tight px-1 italic">
                                        {ts('auditMaxAgeHelp')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
