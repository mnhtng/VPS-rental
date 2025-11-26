'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { logout as logoutNextAuth } from '@/utils/auth';
import { toast } from 'sonner';

interface AuthContextType {
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    refreshAccessToken: () => Promise<boolean>;
    logout: () => Promise<void>;
    isRefreshing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_NAME || 'pcloud_access_token';

/**
 * AuthProvider Component
 * 
 * Manages JWT authentication with:
 * - Access Token stored in localStorage (persisted across page refresh)
 * - Refresh Token stored in HttpOnly Secure cookie (handled by browser)
 * - Auto-refresh mechanism when access token expires
 * 
 * Security Features:
 * - Access tokens are short-lived (15 minutes)
 * - Refresh tokens are long-lived (7 days) in HttpOnly cookies
 * - Access token in localStorage (cleared on logout)
 * - Automatic token refresh on API 401 errors
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Access token stored in localStorage (persisted across page refresh)
    const [accessToken, setAccessTokenState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(ACCESS_TOKEN_KEY);
        }
        return null;
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshingPromise = useRef<Promise<boolean> | null>(null);

    // Wrapper to sync with localStorage
    const setAccessToken = useCallback((token: string | null) => {
        setAccessTokenState(token);
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem(ACCESS_TOKEN_KEY, token);
            } else {
                localStorage.removeItem(ACCESS_TOKEN_KEY);
            }
        }
    }, []);

    // Initialize token from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            if (storedToken && !accessToken) {
                setAccessTokenState(storedToken);
            }
        }
    }, [accessToken]);

    /**
     * Refresh the access token using the refresh token cookie
     * 
     * This function:
     * 1. Sends request to /refresh-token endpoint
     * 2. Refresh token is automatically sent via HttpOnly cookie
     * 3. Receives new access token in response
     * 4. Updates access token in memory
     * 
     * @returns Promise<boolean> - true if refresh successful, false otherwise
     */
    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        // Prevent multiple simultaneous refresh requests
        if (refreshingPromise.current) {
            return refreshingPromise.current;
        }

        const refreshPromise = (async () => {
            try {
                setIsRefreshing(true);

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
                    method: 'POST',
                    credentials: 'include', // Send HttpOnly cookie
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // Refresh token expired or invalid
                    setAccessToken(null);
                    return false;
                }

                const result = await response.json();

                if (result.data?.access_token) {
                    setAccessToken(result.data.access_token);
                    return true;
                }

                return false;
            } catch {
                setAccessToken(null);
                return false;
            } finally {
                setIsRefreshing(false);
                refreshingPromise.current = null;
            }
        })();

        refreshingPromise.current = refreshPromise;
        return refreshPromise;
    }, [setAccessToken]);

    /**
     * Logout user
     * 
     * This function:
     * 1. Calls /logout endpoint to revoke refresh token
     * 2. Clears access token from localStorage
     * 3. Redirects to login page
     */
    const logout = useCallback(async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            await logoutNextAuth();
        } catch {
            toast.error('Please try logging out again');
        } finally {
            // Clear access token from localStorage
            setAccessToken(null);
            window.location.href = `/`;
        }
    }, [accessToken, setAccessToken]);

    /**
     * Auto-refresh access token before it expires
     * 
     * Access tokens expire in 15 minutes.
     * This effect refreshes the token every 14 minutes if user is active.
     */
    useEffect(() => {
        if (!accessToken) return;

        // Refresh token every 14 minutes (before 15 min expiry)
        const intervalId = setInterval(() => {
            refreshAccessToken();
        }, 14 * 60 * 1000); // 14 minutes

        return () => clearInterval(intervalId);
    }, [accessToken, refreshAccessToken]);

    const value: AuthContextType = {
        accessToken,
        setAccessToken,
        refreshAccessToken,
        logout,
        isRefreshing,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use Auth Context
 * 
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
