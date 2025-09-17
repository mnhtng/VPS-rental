'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus, CheckCircle } from 'lucide-react';
import { BubbleBackground } from '@/components/ui/bubble-background';

const RegisterPage: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        subscribeNewsletter: true
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) {
            throw new Error('Full name is required');
        }

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            throw new Error('Please enter a valid email address');
        }

        if (!formData.password || formData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        }

        if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            validateForm();

            // Mock registration API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock successful registration
            setSuccess('Registration successful! Please check your email to verify your account.');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during registration');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <BubbleBackground
                colors={{
                    objects: [
                        'bg-emerald-500/30',
                        'bg-teal-500/30',
                        'bg-green-500/30',
                        'bg-lime-500/30',
                        'bg-cyan-500/30',
                        'bg-blue-500/30',
                    ],
                }}
                className='relative w-full min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 md:py-15'
                objectCount={10}
            >
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-600 p-3 rounded-full">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-green-600">Registration Successful!</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            We&apos;ve sent a verification email to <strong>{formData.email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Please check your inbox and click the verification link to activate your account.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Redirecting to login page...
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </BubbleBackground>
        );
    }

    return (
        <BubbleBackground
            colors={{
                objects: [
                    'bg-emerald-500/30',
                    'bg-teal-500/30',
                    'bg-green-500/30',
                    'bg-lime-500/30',
                    'bg-cyan-500/30',
                    'bg-blue-500/30',
                ],
            }}
            className='relative w-full min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 md:py-15'
            objectCount={10}
        >
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
                        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
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
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        placeholder="Enter your full name"
                                        className="pl-10"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
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
                                        value={formData.email}
                                        onChange={handleInputChange}
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
                                        value={formData.phone}
                                        onChange={handleInputChange}
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
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                                    checked={formData.subscribeNewsletter}
                                    onCheckedChange={(checked) => handleCheckboxChange('subscribeNewsletter', checked as boolean)}
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
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                        <Link href="#" className="text-blue-600 hover:text-blue-500">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="#" className="text-blue-600 hover:text-blue-500">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </BubbleBackground>
    );
};

export default RegisterPage;
