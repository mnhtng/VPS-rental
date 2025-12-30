'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Loader, CheckCircle } from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';
import { useLocale, useTranslations } from 'next-intl';

const PendingVerificationContent = () => {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('auth.pending_verification');
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';
    const { resendVerificationMail } = useAuth();

    const [isResending, setIsResending] = useState(false);

    const handleResendEmail = async () => {
        setIsResending(true);

        try {
            const result = await resendVerificationMail(email, name);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error?.detail
                });
            } else {
                toast.success(result.message);
            }
        } catch {
            toast.error(t('toast.resend_failed'), {
                description: t('toast.resend_failed_desc')
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <BeamsBackground>
            <div className="max-w-md w-full space-y-8">
                <Card>
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-4">
                            <div className="bg-orange-600 p-3 rounded-full">
                                <Clock className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">
                            {t('title')}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {t('description')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Email Display */}
                        {email && (
                            <div className="p-4 bg-muted rounded-lg text-center">
                                <Mail className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                <p className="font-medium">{email}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground text-center">
                                {t('instruction')}
                            </p>

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <span>{t('steps.check_inbox')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <span>{t('steps.click_link')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <span>{t('steps.redirect')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Resend Button */}
                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        {t('didnt_receive')}
                                    </span>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={handleResendEmail}
                                disabled={isResending}
                            >
                                {isResending ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        {t('resending')}
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        {t('resend')}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Additional Info */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>{t('note')}</strong> {t('note_text')}
                            </p>
                        </div>

                        {/* Back to Login */}
                        <Button
                            className="w-full"
                            variant="ghost"
                            onClick={() => router.push(`/login`)}
                        >
                            {t('back_to_login')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        {t('need_help')}{' '}
                        <Link href={`/${locale}/support`} className="text-blue-600 hover:text-blue-500">
                            {t('contact_support')}
                        </Link>
                    </p>
                </div>
            </div>
        </BeamsBackground>
    );
};

const PendingVerificationPage = () => {
    return (
        <Suspense fallback={
            <BeamsBackground>
                <div className="max-w-md w-full space-y-8">
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>
            </BeamsBackground>
        }>
            <PendingVerificationContent />
        </Suspense>
    );
};

export default PendingVerificationPage;
