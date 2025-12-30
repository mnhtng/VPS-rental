import { useAuthStore } from '@/store/authStore';
import { getClientLocale } from '@/utils/locale';

// Default timeout of 30 seconds
const DEFAULT_TIMEOUT = 30000;

interface ApiPatternOptions extends RequestInit {
    timeout?: number;
}

/**
 * Handle API calls with automatic token refresh
 * 
 * @param url The API endpoint URL
 * @param options Fetch options (method, headers, body, signal, timeout, etc.)
 * @returns The fetch Response object 
 */
export const apiPattern = async (url: string, options: ApiPatternOptions = {}): Promise<Response> => {
    const { timeout = DEFAULT_TIMEOUT, signal: externalSignal, ...fetchOptions } = options;

    const locale = getClientLocale();

    // Create internal AbortController for timeout (skip if timeout is 0 = no timeout)
    const timeoutController = new AbortController();
    const timeoutId = timeout > 0 ? setTimeout(() => timeoutController.abort(), timeout) : null;

    // Combine external signal (from component) with timeout signal
    // If no timeout, only use external signal or no signal at all
    const combinedSignal = timeout > 0
        ? (externalSignal
            ? createCombinedSignal(externalSignal, timeoutController.signal)
            : timeoutController.signal)
        : externalSignal || undefined;

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
                'Accept-Language': locale,
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
                        'Accept-Language': locale,
                        ...fetchOptions.headers,
                    },
                    credentials: 'include',
                });
            }
        }

        return response;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
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