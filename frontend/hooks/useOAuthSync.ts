'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to sync OAuth login with backend API
 * This ensures refresh token is properly set in browser cookies
 */
export function useOAuthSync() {
    const { data: session, status } = useSession();
    const syncedRef = useRef(false);

    const syncOAuth = useCallback(async () => {
        if (!session?.user?.email) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: session.user.email,
                    role: session.user.role || 'USER',
                }),
            });

            if (!response.ok) {
                return;
            }
        } catch {
            return;
        }
    }, [session?.user?.email, session?.user?.role]);

    useEffect(() => {
        if (
            status === 'authenticated' &&
            session?.user?.email &&
            session?.user?.provider !== 'credentials' &&
            !syncedRef.current
        ) {
            syncedRef.current = true;

            syncOAuth();
        }
    }, [status, session?.user?.email, session?.user?.provider, syncOAuth]);
}

