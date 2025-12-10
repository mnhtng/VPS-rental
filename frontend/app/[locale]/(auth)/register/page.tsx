'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    Phone,
    UserPlus,
    RefreshCw
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

const RegisterPage = () => {
    const router = useRouter();
    const locale = useLocale();
    const { register } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = new FormData(e.target as HTMLFormElement);
        const formData = {
            name: submitData.get('name') as string,
            email: submitData.get('email') as string,
            phone: submitData.get('phone') as string,
            password: submitData.get('password') as string,
            confirmPassword: submitData.get('confirmPassword') as string,
            subscribeNewsletter: submitData.get('subscribeNewsletter') === 'on',
        };

        if (!formData.subscribeNewsletter) {
            toast.error('You must agree to receive the newsletter');
            setIsLoading(false);
            return
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (formData.phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

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

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData?.phone,
            });

            if (result.error) {
                toast.error(result.message, {
                    description: result.error?.detail
                });
            } else {
                toast.success(result.message);
                router.push(`/${locale}/pending-verification?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`);
            }
        } catch {
            toast.error('Registration failed', {
                description: 'Please try again later'
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
                            <UserPlus className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href={`/${locale}/login`} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                            Sign in here
                        </Link>
                    </p>
                </div>

                {/* Registration Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Get started with VPS</CardTitle>
                        <CardDescription className="text-center">
                            Create your account to access premium VPS hosting services
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        placeholder="Enter your full name"
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address *</Label>
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

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (Optional)</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder="Enter your phone number"
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
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
                                        placeholder="Create a password"
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
                                <p className="text-xs text-muted-foreground italic">
                                    Password must be at least 8 characters with uppercase, lowercase, and numbers
                                </p>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password *</Label>
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
                                        placeholder="Confirm your password"
                                        className="pl-10 pr-10"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Newsletter Subscription */}
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="subscribeNewsletter"
                                    name="subscribeNewsletter"
                                    className="mt-1 border border-accent"
                                    disabled={isLoading}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="subscribeNewsletter"
                                        className="text-sm font-normal leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Subscribe to our newsletter for product updates and special offers
                                    </Label>
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
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create Account
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        By creating an account, you acknowledge that you have read and understood our{' '}
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

export default RegisterPage;
