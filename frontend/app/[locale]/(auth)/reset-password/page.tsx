'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
    Eye,
    EyeOff,
    Lock,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Loader
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import { useLocale, useTranslations } from 'next-intl';

const ResetPasswordContent = () => {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('auth.reset_password');
    const { resetPassword, validateResetToken } = useAuth();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const hasValidated = useRef(false); // Prevents multiple validations

    const invalidInstructions = t.raw('invalid.instructions') as string[];

    useEffect(() => {
        const validateToken = async () => {
            if (hasValidated.current)
                return;

            if (!token || !email) {
                setIsValidating(false);
                setIsValidToken(false);
                toast.error(t('toast.invalid_link'));
                return;
            }

            hasValidated.current = true;

            try {
                const result = await validateResetToken(token, email);

                if (result.error) {
                    setIsValidToken(false);
                    toast.error(result.message, {
                        description: result.error?.detail
                    })
                } else {
                    setIsValidToken(true);
                    toast.success(result.message);
                }
            } catch {
                setIsValidToken(false);
                toast.error(t('toast.token_invalid'), {
                    description: t('toast.failed_desc')
                });
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = new FormData(e.target as HTMLFormElement);
        const formData = {
            password: submitData.get('password') as string,
            confirmPassword: submitData.get('confirmPassword') as string,
        };

        try {
            if (formData.password.length < 6) {
                toast.error(t('toast.password_length'));
                setIsLoading(false);
                return;
            } else if (!/[A-Z]/.test(formData.password)) {
                toast.error(t('toast.password_uppercase'));
                setIsLoading(false);
                return;
            } else if (!/[a-z]/.test(formData.password)) {
                toast.error(t('toast.password_lowercase'));
                setIsLoading(false);
                return;
            } else if (!/[0-9]/.test(formData.password)) {
                toast.error(t('toast.password_number'));
                setIsLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                toast.error(t('toast.password_mismatch'));
                setIsLoading(false);
                return;
            }

            if (!token || !email) {
                toast.error(t('toast.invalid_link'));
                setIsLoading(false);
                return;
            }

            const result = await resetPassword(token, email, formData.password);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error?.detail
                });
            } else {
                setIsSuccess(true);
                toast.success(result.message);
            }
        } catch {
            toast.error(t('toast.failed'), {
                description: t('toast.failed_desc')
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while validating token
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <BeamsBackground className="absolute inset-0" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-muted-foreground">
                                    {t('validating')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Invalid token state
    if (!isValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <BeamsBackground className="absolute inset-0" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <AlertCircle className="w-16 h-16 text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-red-600">
                            {t('invalid.title')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t('invalid.subtitle')}
                        </p>
                    </div>

                    {/* Invalid Token Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        {t('invalid.reason')}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {invalidInstructions.map((instruction, index) => (
                                        <p key={index}>• {instruction}</p>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push(`/forgot-password`)}
                                    className="w-full"
                                >
                                    {t('invalid.request_new')}
                                </Button>

                                <Button
                                    onClick={() => router.push(`/login`)}
                                    variant="outline"
                                    className="w-full"
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

    // Success state
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
                                        {t('success.message')}
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.push(`/login`)}
                                className="w-full"
                            >
                                {t('success.login_now')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <BeamsBackground className="absolute inset-0" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Lock className="w-16 h-16 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold">
                        {t('title')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t('description')} <span className="font-medium">{email}</span>
                    </p>
                </div>

                {/* Reset Password Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">{t('card_title')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('card_description')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('password_label')}</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        placeholder={t('password_placeholder')}
                                        className="pl-10 pr-10"
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{t('confirm_password_label')}</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        placeholder={t('confirm_password_placeholder')}
                                        className="pl-10 pr-10"
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
                                    {t('requirements.title')}
                                </p>
                                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                                    <li>• {t('requirements.min_length')}</li>
                                    <li>• {t('requirements.combine')}</li>
                                    <li>• {t('requirements.no_personal')}</li>
                                </ul>
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

const ResetPasswordPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <BeamsBackground className="absolute inset-0" />
                <div className="w-full max-w-md space-y-8 relative z-10">
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPasswordPage;
