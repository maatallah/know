'use client';

import { useTranslations } from 'next-intl';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'default';
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    variant = 'danger'
}: ConfirmModalProps) {
    const t = useTranslations('common');

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const variants = {
        danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
        warning: 'bg-orange-600 hover:bg-orange-700 text-white',
        default: 'bg-primary hover:bg-primary/90 text-primary-foreground'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onCancel} />
            <div className="relative z-[101] w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <AlertTriangle className={cn("h-5 w-5", variant === 'danger' ? 'text-destructive' : variant === 'warning' ? 'text-orange-500' : 'text-primary')} />
                        {title || t('confirm')}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="rounded-full p-1.5 hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-foreground/80">{message}</p>
                </div>
                
                <div className="flex items-center justify-end gap-3 bg-muted/20 px-6 py-4 border-t border-border/50">
                    <button
                        onClick={onCancel}
                        className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors border border-border bg-background"
                    >
                        {cancelText || t('cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={cn("rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-sm", variants[variant])}
                    >
                        {confirmText || t('confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
