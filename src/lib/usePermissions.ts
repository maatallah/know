'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserPermissions {
    authenticated: boolean;
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    theme?: string;
    locale?: string;
    permissions: Record<string, boolean>;
}

export function clearPermissionsCache() {
    // No-op after removing global cache
}

export function usePermissions() {
    const [data, setData] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/me')
            .then((r) => r.json())
            .then((d) => {
                if (d.authenticated) {
                    setData(d);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const can = useCallback(
        (permission: string) => data?.permissions?.[permission] ?? false,
        [data]
    );

    return { user: data, loading, can };
}
