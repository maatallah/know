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

let cachedPermissions: UserPermissions | null = null;

export function clearPermissionsCache() {
    cachedPermissions = null;
}

export function usePermissions() {
    const [data, setData] = useState<UserPermissions | null>(cachedPermissions);
    const [loading, setLoading] = useState(!cachedPermissions);

    useEffect(() => {
        if (cachedPermissions) return;
        fetch('/api/me')
            .then((r) => r.json())
            .then((d) => {
                if (d.authenticated) {
                    cachedPermissions = d;
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
