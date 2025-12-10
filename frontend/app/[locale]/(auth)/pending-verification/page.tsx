'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Loader, CheckCircle } from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';
import { useLocale } from 'next-intl';

const PendingVerificationPage = () => {
    const router = useRouter();
    const locale = useLocale();
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
            toast.error('Failed to resend email', {
                description: 'Please try again later'
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
                            Verify Your Email
                        </CardTitle>
                        <CardDescription className="text-center">
                            We&apos;ve sent a verification link to your email address
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
                                To complete your registration, please check your email and click the verification link.
                            </p>

                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <span>Check your inbox and spam folder</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <span>Click the verification link in the email</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <span>You&apos;ll be redirected to login automatically</span>
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
                                        Didn&apos;t receive the email?
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Resend Verification Email
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Additional Info */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> The verification link will expire in 24 hours.
                                If expired, you&apos;ll need to request a new one.
                            </p>
                        </div>

                        {/* Back to Login */}
                        <Button
                            className="w-full"
                            variant="ghost"
                            onClick={() => router.push('/login')}
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        Need help?{' '}
                        <Link href={`/${locale}/support`} className="text-blue-600 hover:text-blue-500">
                            Contact Support
                        </Link>
                    </p>
                </div>
            </div>
        </BeamsBackground>
    );
};

export default PendingVerificationPage;
