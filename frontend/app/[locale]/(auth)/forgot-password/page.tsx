'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Mail,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import { useLocale, useTranslations } from 'next-intl';

const ForgotPasswordPage = () => {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('auth.forgot_password');
    const { forgotPassword, resendResetPasswordEmail } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = new FormData(e.target as HTMLFormElement);
        const formData = {
            email: submitData.get('email') as string,
        };

        try {
            if (!/\S+@\S+\.\S+/.test(formData.email)) {
                toast.error(t('toast.invalid_email'));
                setIsLoading(false);
                return;
            }

            const result = await forgotPassword(formData.email);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error?.detail
                });
            } else {
                setEmail(formData.email);
                setIsSuccess(true);

                if (result.data?.reset_token)
                    toast.success(result.message);
                else
                    toast.info(result.message);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('toast.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setIsLoading(true);

        try {
            const result = await resendResetPasswordEmail(email);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error?.detail
                });
            } else {
                toast.info(result.message);
            }
        } catch {
            toast.error(t('toast.failed'), {
                description: t('toast.failed_desc')
            });
        } finally {
            setIsLoading(false);
        }
    };

    const instructions = t.raw('success.instructions') as string[];

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <BeamsBackground className="absolute inset-0" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold">
                            {t('success.title')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('success.subtitle')}
                        </p>
                    </div>

                    {/* Success Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        {t('success.sent_to')}
                                    </p>
                                    <p className="font-medium text-green-800 dark:text-green-300">
                                        {email}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {instructions.map((instruction, index) => (
                                        <p key={index}>• {instruction}</p>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleResendEmail}
                                    variant="outline"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('success.resending') : t('success.resend')}
                                </Button>

                                <Button
                                    onClick={() => router.push(`/login`)}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t('back_to_login')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <BeamsBackground className="absolute inset-0" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <AlertCircle className="w-16 h-16 text-orange-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold">
                        {t('title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t('description')}
                    </p>
                </div>

                {/* Forgot Password Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">{t('card_title')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('card_description')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('email_label')}</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder={t('email_placeholder')}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        {t('submitting')}
                                    </>
                                ) : (
                                    <>
                                        {t('submit')}
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Back to Login */}
                        <div className="text-center">
                            <Link
                                href={`/${locale}/login`}
                                className={cn(
                                    "text-sm text-blue-600 hover:text-blue-500 inline-flex items-center",
                                    isLoading && "pointer-events-none select-none"
                                )}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('back_to_login')}
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
