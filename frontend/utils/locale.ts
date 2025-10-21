const supportedLocales = ['en', 'vi'] as const;

export type SupportedLocale = typeof supportedLocales[number];

export const isValidLocale = (locale: string): locale is SupportedLocale => {
    return supportedLocales.includes(locale as SupportedLocale);
};

export const getClientLocale = (): SupportedLocale => {
    if (typeof window !== 'undefined') {
        // 1. Check NEXT_LOCALE cookie
        const cookies = document.cookie.split(';');
        const nextLocaleCookie = cookies
            .find(cookie => cookie.trim().startsWith('NEXT_LOCALE='))
            ?.split('=')[1]
            ?.trim();

        if (nextLocaleCookie && isValidLocale(nextLocaleCookie)) {
            return nextLocaleCookie;
        }

        // 2. Check localStorage 
        const storedLocale = localStorage.getItem('locale');
        if (storedLocale && isValidLocale(storedLocale)) {
            return storedLocale;
        }

        // 3. Fallback to browser language
        const browserLang = navigator.language.split('-')[0];
        return isValidLocale(browserLang) ? browserLang : 'en';
    }

    return 'en';
}

export const getServerLocale = (
    cookies: string | undefined,
    acceptLanguage?: string | null,
    pathname?: string
): SupportedLocale => {
    // 1. Check NEXT_LOCALE cookie first (highest priority)
    if (cookies) {
        const nextLocaleCookie = cookies
            .split('; ')
            .find(row => row.startsWith('NEXT_LOCALE='))
            ?.split('=')[1]
            ?.trim();

        if (nextLocaleCookie && isValidLocale(nextLocaleCookie)) {
            return nextLocaleCookie;
        }

        // 2. Check locale cookie as fallback
        const localeCookie = cookies
            .split('; ')
            .find(row => row.startsWith('locale='))
            ?.split('=')[1]
            ?.trim();

        if (localeCookie && isValidLocale(localeCookie)) {
            return localeCookie;
        }
    }

    // 3. Extract locale from pathname (e.g., /en/dashboard or /vi/profile)
    if (pathname) {
        const pathSegments = pathname.split('/').filter(Boolean);
        const firstSegment = pathSegments[0];

        if (firstSegment && isValidLocale(firstSegment)) {
            return firstSegment;
        }
    }

    // 4. Parse Accept-Language header
    if (acceptLanguage) {
        const languages = acceptLanguage
            .split(',')
            .map(lang => {
                // Parse language tags like "en-US;q=0.9" or "vi"
                const [langCode] = lang.split(';')[0].trim().split('-');
                return langCode.toLowerCase();
            })
            .filter(isValidLocale);

        if (languages.length > 0) {
            return languages[0];
        }
    }

    return 'en';
}
