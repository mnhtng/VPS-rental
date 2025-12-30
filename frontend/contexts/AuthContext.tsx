'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { logout as logoutNextAuth } from '@/utils/auth';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { apiPattern } from '@/utils/pattern';

interface AuthContextType {
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * 
 * Provides authentication context to child components
 *  - Initializes auth state on app load to restore session (access token) if possible 
 *  - Auto-refreshes token before expiry
 *  - Provides logout functionality
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize auth state on app load to restore session (access token) if possible 
    useEffect(() => {
        useAuthStore.getState().initialize();
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'POST',
            });

            await logoutNextAuth();
        } catch {
            toast.error('Please try logging out again');
        } finally {
            // Clear access token from memory
            useAuthStore.getState().logout();
            window.location.href = `/`;
        }
    }, []);

    /**
     * Auto-refresh access token before it expires
     * 
     * Access tokens expire in 15 minutes.
     * This effect refreshes the token every 14 minutes if user is active.
     */
    useEffect(() => {
        if (!useAuthStore.getState().accessToken) return;

        // Refresh token every 14 minutes (before 15 min expiry)
        const intervalId = setInterval(() => {
            useAuthStore.getState().refreshAccessToken();
        }, 14 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    const value: AuthContextType = {
        logout,
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
