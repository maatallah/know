'use client';

import { useState, useEffect } from 'react';
import { QrCode, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export function QrScannerModal() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const t = useTranslations('machines');
    const tn = useTranslations('nav');

    const handleScan = (result: any) => {
        if (!result) return;

        let valueStr = '';
        if (Array.isArray(result) && result[0]) {
            valueStr = result[0].rawValue || result[0].text || '';
        } else if (typeof result === 'object') {
            valueStr = result.rawValue || result.text || '';
        } else if (typeof result === 'string') {
            valueStr = result;
        }

        if (!valueStr) return;

        try {
            const url = new URL(valueStr);
            if (url.pathname.includes('/machines/')) {
                window.location.href = valueStr;
            } else {
                alert(t('invalidQr'));
            }
        } catch {
            alert(t('invalidUrl'));
        }

        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                title={tn('scanQr')}
            >
                <QrCode className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                    <div className="relative w-full max-w-md rounded-2xl bg-card border border-border overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <QrCode className="w-5 h-5" />
                                {tn('scanQr')}
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="aspect-square w-full bg-black relative">
                            <Scanner
                                onScan={handleScan}
                                onError={(e) => console.error(e)}
                                components={{
                                    onOff: true,
                                    torch: true,
                                    zoom: false,
                                    finder: true
                                }}
                            />
                        </div>

                        <div className="p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                            {t('scanDescription')}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
