"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientLocale } from '@/utils/locale';

export default function Error({
    error,
}: {
    error?: Error;
    reset?: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        const getPreferredLocale = getClientLocale();
        const locale = getPreferredLocale || 'en';

        const statusCode = error?.message && !isNaN(Number(error.message)) ? Number(error.message) : 500;

        router.replace(`/${locale}/error?status=${statusCode}`);
    }, [router, error]);

    return null;
}