'use client';

import React, { useState } from 'react';
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
    Mail,
    Lock,
    LogIn,
    Loader
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { GitHub, Google } from '@/components/custom/icon/brand';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocale } from 'use-intl/react';
import useAuth from '@/hooks/useAuth';
import { loginWithCredentials } from '@/utils/auth';
import { useAuthStore } from '@/store/authStore';

const LoginPage = () => {
    const router = useRouter();
    const locale = useLocale();
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = new FormData(e.target as HTMLFormElement);
        const formData = {
            email: submitData.get('email') as string,
            password: submitData.get('password') as string,
        };

        try {
            if (!formData.email || !formData.password) {
                toast.error('Please fill in all fields');
                return;
            }

            if (!/\S+@\S+\.\S+/.test(formData.email)) {
                toast.error('Please enter a valid email address');
                return;
            }

            const result = await login({
                email: formData.email,
                password: formData.password,
            })

            if (result.error) {
                toast.error('Invalid email or password');
            } else if (result.data && result.data.email_verified === false) {
                toast.info('Please verify your email to continue', {
                    description: 'We\'ve sent a verification email to your inbox'
                });

                router.push(`/${locale}/pending-verification?email=${encodeURIComponent(result.data.email)}&name=${encodeURIComponent(result.data.name)}`);
            } else {
                // Store access token in memory
                useAuthStore.getState().setAccessToken(result.data?.access_token || '');

                await loginWithCredentials(formData.email, formData.password);

                toast.success('Login successful');
                window.location.href = `/${locale}${callbackUrl}`;
            }
        } catch {
            toast.error("Login failed", {
                description: "Please try again later"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOauthSignIn = (provider: 'google' | 'github') => async () => {
        setIsLoading(true);

        try {
            await signIn(provider, {
                redirectTo: `/${locale}${callbackUrl}`,
            });
        } catch {
            toast.error("Login failed", {
                description: "Please try again later"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <BeamsBackground>
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <LogIn className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href={`/${locale}/register`} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                            Create one here
                        </Link>
                    </p>
                </div>

                {/* Login Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access your VPS dashboard
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
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
                                        placeholder="Enter your email"
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        placeholder="Enter your password"
                                        className="pl-10 pr-10"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Checkbox
                                        id="remember-me"
                                        name="remember-me"
                                        className="border border-accent"
                                        disabled={isLoading}
                                    />
                                    <Label htmlFor="remember-me" className="ml-2 text-sm">
                                        Remember me
                                    </Label>
                                </div>

                                <div className="text-sm">
                                    <Link href={`/${locale}/forgot-password`} className={cn(
                                        "text-blue-600 hover:text-blue-500",
                                        isLoading && "pointer-events-none select-none"
                                    )}>
                                        Forgot your password?
                                    </Link>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Sign in
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-card px-4 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Google Login */}
                            <Button
                                variant="ghost"
                                className="flex items-center justify-center gap-2"
                                onClick={handleOauthSignIn('google')}
                                disabled={isLoading}
                            >
                                <Google />
                                {isLoading ? 'Connecting...' : 'Google'}
                            </Button>

                            {/* GitHub Login */}
                            <Button
                                variant="ghost"
                                className="flex items-center justify-center gap-2"
                                onClick={handleOauthSignIn('github')}
                                disabled={isLoading}
                            >
                                <GitHub />
                                {isLoading ? 'Connecting...' : 'GitHub'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        By signing in, you agree to our{' '}
                        <Link href="#" className={cn(
                            "text-blue-600 hover:text-blue-500",
                            isLoading && "pointer-events-none select-none"
                        )}>
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="#" className={cn(
                            "text-blue-600 hover:text-blue-500",
                            isLoading && "pointer-events-none select-none"
                        )}>
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </BeamsBackground>
    );
};

export default LoginPage;
