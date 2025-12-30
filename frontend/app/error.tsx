"use client"

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Error({
    error,
}: {
    error?: Error;
    reset?: () => void;
}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const statusCode = error?.message && !isNaN(Number(error.message)) ? Number(error.message) : 500;

        router.replace(`/error?status=${statusCode}&callback=${encodeURIComponent(pathname)}`);
    }, [router, error, pathname]);

    return null;
}