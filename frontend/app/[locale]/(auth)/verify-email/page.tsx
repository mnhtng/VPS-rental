'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { useLocale } from 'next-intl';

// This page handles the verification redirect
const VerifyEmailRedirect = () => {
    const { verifyEmail } = useAuth();
    const locale = useLocale();

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const handleVerification = async () => {
            const token = searchParams.get('token');
            const email = searchParams.get('email');

            if (token && email) {
                await verifyEmail(token, email);
                // Redirect to the API endpoint for verification
                window.location.href = `/api/credential/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
            } else {
                // If missing parameters, redirect to error page
                router.push(`/${locale}/email-verified?error=Missing verification parameters&code=MISSING_PARAMS`);
            }
        };

        handleVerification();
    }, [locale, router, searchParams, verifyEmail]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Đang xác minh email...</p>
            </div>
        </div>
    );
};

export default VerifyEmailRedirect;