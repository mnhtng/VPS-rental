"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientLocale } from '@/utils/locale';

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        const getPreferredLocale = getClientLocale();

        const locale = getPreferredLocale || 'en';

        router.replace(`/${locale}/not-found`);
    }, [router]);
}
