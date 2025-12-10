'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { useLocale } from 'next-intl';

const ResetPasswordPage = () => {
    const router = useRouter();
    const locale = useLocale();
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
    const hasValidated = useRef(false); // Prevent multiple API calls

    useEffect(() => {
        const validateToken = async () => {
            // Prevent multiple API calls
            if (hasValidated.current)
                return;

            if (!token || !email) {
                setIsValidating(false);
                setIsValidToken(false);
                toast.error('Invalid password reset link');
                return;
            }

            // Mark as validated to prevent subsequent API calls
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
                toast.error("Token validation failed", {
                    description: "Please try again later"
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
                toast.error('Password must be at least 6 characters long');
                setIsLoading(false);
                return;
            } else if (!/[A-Z]/.test(formData.password)) {
                toast.error('Password must contain at least one uppercase letter');
                setIsLoading(false);
                return;
            } else if (!/[a-z]/.test(formData.password)) {
                toast.error('Password must contain at least one lowercase letter');
                setIsLoading(false);
                return;
            } else if (!/[0-9]/.test(formData.password)) {
                toast.error('Password must contain at least one number');
                setIsLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match');
                setIsLoading(false);
                return;
            }

            if (!token || !email) {
                toast.error('Invalid password reset link');
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
            toast.error("Reset password failed", {
                description: "Please try again later"
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
                                    Validating password reset link...
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
                            Invalid Link
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Password reset link is invalid or has expired
                        </p>
                    </div>

                    {/* Invalid Token Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        Link may have expired (1 hour) or has already been used
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>• Password reset link is only valid for 1 hour</p>
                                    <p>• Each link can only be used once</p>
                                    <p>• Please request a new link if needed</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push(`/${locale}/forgot-password`)}
                                    className="w-full"
                                >
                                    Request new link
                                </Button>

                                <Button
                                    onClick={() => router.push(`/${locale}/login`)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to login
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
                            Password reset successful!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Your password has been updated successfully
                        </p>
                    </div>

                    {/* Success Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        You can now log in with your new password
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.push(`/${locale}/login`)}
                                className="w-full"
                            >
                                Log in now
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
                        Set New Password
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Enter a new password for account <span className="font-medium">{email}</span>
                    </p>
                </div>

                {/* Reset Password Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Create New Password</CardTitle>
                        <CardDescription className="text-center">
                            Password must be at least 6 characters
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
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
                                        placeholder="Enter new password"
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
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                                        placeholder="Re-enter new password"
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
                                    Password requirements:
                                </p>
                                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                                    <li>• At least 6 characters</li>
                                    <li>• Should combine letters and numbers</li>
                                    <li>• Don&apos;t use easily guessable personal information</li>
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
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        Update Password
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
                                Back to login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPasswordPage;