'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
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
    Loader
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

const RegisterPage = () => {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('auth.register');
    const tCommon = useTranslations('common');
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
            toast.error(t('toast.newsletter_error'));
            setIsLoading(false);
            return
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error(t('toast.invalid_email'));
            setIsLoading(false);
            return;
        }

        if (formData.phone && formData.phone.length < 10) {
            toast.error(t('toast.invalid_phone'));
            setIsLoading(false);
            return;
        }

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
                router.push(`/pending-verification?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`);
            }
        } catch {
            toast.error(t('toast.failed'), {
                description: t('toast.failed_desc')
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
                        {t('title')}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t('subtitle')}{' '}
                        <Link href={`/${locale}/login`} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                            {t('sign_in')}
                        </Link>
                    </p>
                </div>

                {/* Registration Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">{t('welcome')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('description')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('name_label')} *</Label>
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
                                        placeholder={t('name_placeholder')}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('email_label')} *</Label>
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

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('phone_label')} {t('phone_optional')}</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder={t('phone_placeholder')}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('password_label')} *</Label>
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
                                    {t('password_hint')}
                                </p>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{t('confirm_password_label')} *</Label>
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
                                        {t('newsletter_label')}
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
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        {t('submitting')}
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        {t('submit')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        {t('terms_notice')}{' '}
                        <Link href={`/${locale}/terms`} className={cn(
                            "text-blue-600 hover:text-blue-500",
                            isLoading && "pointer-events-none select-none"
                        )}>
                            {t('terms_of_service')}
                        </Link>{' '}
                        {tCommon('and')}{' '}
                        <Link href={`/${locale}/privacy`} className={cn(
                            "text-blue-600 hover:text-blue-500",
                            isLoading && "pointer-events-none select-none"
                        )}>
                            {t('privacy_policy')}
                        </Link>
                    </p>
                </div>
            </div>
        </BeamsBackground>
    );
};

export default RegisterPage;

