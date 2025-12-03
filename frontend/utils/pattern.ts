import { useAuthStore } from '@/store/authStore';

/**
 * Helper function to handle API calls with automatic token refresh
 * 
 * @param url The API endpoint URL
 * @param options Fetch options (method, headers, body, etc.)
 * @returns The fetch Response object 
 */
export const apiPattern = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let currentToken = useAuthStore.getState().accessToken;

    if (!currentToken) {
        const refreshed = await useAuthStore.getState().refreshAccessToken();

        if (!refreshed) {
            throw new Error('NO_ACCESS_TOKEN');
        }

        currentToken = useAuthStore.getState().accessToken;
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // Send HttpOnly cookie
    });

    // If 401, try refresh once and retry
    if (response.status === 401) {
        const refreshed = await useAuthStore.getState().refreshAccessToken();

        if (refreshed) {
            const newToken = useAuthStore.getState().accessToken;
            return await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                credentials: 'include',
            });
        }
    }

    return response;
};