"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        const getPreferredLocale = () => {
            if (typeof window !== 'undefined') {
                // 1. Check NEXT_LOCALE cookie
                const cookies = document.cookie.split(';');
                const nextLocaleCookie = cookies
                    .find(cookie => cookie.trim().startsWith('NEXT_LOCALE='))
                    ?.split('=')[1]
                    ?.trim();

                if (nextLocaleCookie && ['en', 'vi'].includes(nextLocaleCookie)) {
                    return nextLocaleCookie;
                }

                // 2. Check localStorage 
                const storedLocale = localStorage.getItem('locale');
                if (storedLocale && ['en', 'vi'].includes(storedLocale)) {
                    return storedLocale;
                }

                // 3. Fallback to browser language
                const browserLang = navigator.language.split('-')[0];
                return ['en', 'vi'].includes(browserLang) ? browserLang : 'en';
            }
            return 'en';
        };

        const locale = getPreferredLocale();

        router.replace(`/${locale}/error`);
    }, [router]);
}