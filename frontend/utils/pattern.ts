import { useAuthStore } from '@/store/authStore';

// Default timeout of 30 seconds
const DEFAULT_TIMEOUT = 30000;

interface ApiPatternOptions extends RequestInit {
    timeout?: number;
}

/**
 * Helper function to handle API calls with automatic token refresh
 * 
 * @param url The API endpoint URL
 * @param options Fetch options (method, headers, body, signal, timeout, etc.)
 * @returns The fetch Response object 
 */
export const apiPattern = async (url: string, options: ApiPatternOptions = {}): Promise<Response> => {
    const { timeout = DEFAULT_TIMEOUT, signal: externalSignal, ...fetchOptions } = options;

    // Create internal AbortController for timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

    // Combine external signal (from component) with timeout signal
    const combinedSignal = externalSignal
        ? createCombinedSignal(externalSignal, timeoutController.signal)
        : timeoutController.signal;

    try {
        let currentToken = useAuthStore.getState().accessToken;

        if (!currentToken) {
            const refreshed = await useAuthStore.getState().refreshAccessToken();

            if (!refreshed) {
                throw new Error('NO_ACCESS_TOKEN');
            }

            currentToken = useAuthStore.getState().accessToken;
        }

        const response = await fetch(url, {
            ...fetchOptions,
            signal: combinedSignal,
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
            credentials: 'include', // Send HttpOnly cookie
        });

        // If 401, try refresh once and retry
        if (response.status === 401) {
            const refreshed = await useAuthStore.getState().refreshAccessToken();

            if (refreshed) {
                const newToken = useAuthStore.getState().accessToken;
                return await fetch(url, {
                    ...fetchOptions,
                    signal: combinedSignal,
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json',
                        ...fetchOptions.headers,
                    },
                    credentials: 'include',
                });
            }
        }

        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * Combines multiple AbortSignals into one
 * Aborts when any of the signals abort
 */
function createCombinedSignal(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort(signal.reason);
            break;
        }
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }

    return controller.signal;
}