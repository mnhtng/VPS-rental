import { create } from 'zustand';

interface AuthState {
    accessToken: string | null;
    isRefreshing: boolean;
    refreshPromise: Promise<boolean> | null;

    // Actions
    setAccessToken: (token: string | null) => void;
    refreshAccessToken: () => Promise<boolean>;
    logout: () => void;
    initialize: () => Promise<void>;
}

/**
 * Zustand Store for Authentication
 * 
 * Features:
 * - Access token stored in memory only (not persisted)
 * - Auto-refresh mechanism when token expires
 * - Prevents duplicate refresh requests
 * - Refresh token stored in HttpOnly cookie (handled by backend)
 */
export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    isRefreshing: false,
    refreshPromise: null,

    setAccessToken: (token: string | null) => {
        set({ accessToken: token });
    },

    /**
     * Initialize auth state by attempting to refresh token
     * Call this on app startup to restore session
     */
    initialize: async () => {
        const { refreshAccessToken } = get();
        await refreshAccessToken();
    },

    /**
     * Refresh the access token using the refresh token cookie
     * 
     * This function:
     * 1. Prevents duplicate refresh requests using refreshPromise
     * 2. Sends request to /refresh-token endpoint
     * 3. Refresh token is automatically sent via HttpOnly cookie
     * 4. Receives new access token in response
     * 5. Updates access token in memory
     * 
     * @returns Promise<boolean> - true if refresh successful, false otherwise
     */
    refreshAccessToken: async (): Promise<boolean> => {
        const state = get();

        // Prevent multiple simultaneous refresh requests
        if (state.refreshPromise) {
            return state.refreshPromise;
        }

        const refreshPromise = (async () => {
            try {
                set({ isRefreshing: true });

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
                    {
                        method: 'POST',
                        credentials: 'include', // Send HttpOnly cookie
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    // Refresh token expired or invalid
                    set({ accessToken: null });
                    return false;
                }

                const result = await response.json();

                if (result.data?.access_token) {
                    set({ accessToken: result.data.access_token });
                    return true;
                }

                return false;
            } catch {
                set({ accessToken: null });
                return false;
            } finally {
                set({ isRefreshing: false, refreshPromise: null });
            }
        })();

        set({ refreshPromise });
        return refreshPromise;
    },

    logout: () => {
        set({ accessToken: null, isRefreshing: false, refreshPromise: null });
    },
}));

/**
 * Get current access token
 * If token is null, automatically attempts to refresh
 */
export const getAccessToken = async (): Promise<string | null> => {
    const state = useAuthStore.getState();

    // If token exists, return it
    if (state.accessToken) {
        return state.accessToken;
    }

    // If no token, try to refresh
    const refreshed = await state.refreshAccessToken();

    if (refreshed) {
        return useAuthStore.getState().accessToken;
    }

    return null;
};
