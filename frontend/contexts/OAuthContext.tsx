'use client';

import { useOAuthSync } from '@/hooks/useOAuthSync';

export function OAuthSyncProvider({ children }: { children: React.ReactNode }) {
    useOAuthSync();
    return <>{children}</>;
}
