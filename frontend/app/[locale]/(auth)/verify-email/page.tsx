'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    CheckCircle,
    XCircle,
    Mail,
    ArrowRight,
    Loader,
    AlertTriangle
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

type VerificationStatus = 'loading' | 'success' | 'error';
type ErrorCode = 'INVALID_TOKEN' | 'USER_NOT_FOUND' | 'ALREADY_VERIFIED' | 'SERVER_ERROR';

interface ErrorInfo {
    icon: React.ReactNode;
    title: string;
    message: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    showRegisterButton: boolean;
    instructions: string[];
}

const EmailVerifiedPage = () => {
    const locale = useLocale();
    const { verifyEmail } = useAuth();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<VerificationStatus>('loading');
    const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
    const hasVerified = useRef(false); // Prevent multiple API calls

    // Memoize error info configuration
    const getErrorInfo = useCallback((code: ErrorCode | null): ErrorInfo => {
        const errorConfigs: Record<ErrorCode, ErrorInfo> = {
            INVALID_TOKEN: {
                icon: <XCircle className="h-12 w-12 text-red-600" />,
                title: 'Invalid Verification Link',
                message: 'The verification link has expired or is invalid. Please try registering again.',
                bgColor: 'bg-red-100',
                textColor: 'text-red-600',
                borderColor: 'border-red-200',
                showRegisterButton: true,
                instructions: [
                    'Link may have expired (24 hours)',
                    'Register again to receive a new link',
                    'Check if the link is complete'
                ]
            },
            USER_NOT_FOUND: {
                icon: <AlertTriangle className="h-12 w-12 text-orange-600" />,
                title: 'Account Not Found',
                message: 'The account associated with this email does not exist. Please register again.',
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-600',
                borderColor: 'border-orange-200',
                showRegisterButton: true,
                instructions: [
                    'Account may have been deleted',
                    'Register with the correct email'
                ]
            },
            ALREADY_VERIFIED: {
                icon: <CheckCircle className="h-12 w-12 text-blue-600" />,
                title: 'Email Already Verified',
                message: 'This email has already been verified. You can log in now.',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-600',
                borderColor: 'border-blue-200',
                showRegisterButton: false,
                instructions: [
                    'Account is ready to use',
                    'Log in with your email and password'
                ]
            },
            SERVER_ERROR: {
                icon: <XCircle className="h-12 w-12 text-red-600" />,
                title: 'An Error Occurred',
                message: 'An error occurred during verification. Please try again later.',
                bgColor: 'bg-red-100',
                textColor: 'text-red-600',
                borderColor: 'border-red-200',
                showRegisterButton: true,
                instructions: [
                    'Try again in a few minutes',
                    'Contact support if the error persists'
                ]
            }
        };

        return code ? errorConfigs[code] : errorConfigs.SERVER_ERROR;
    }, []);

    const errorInfo = useMemo(() => getErrorInfo(errorCode), [errorCode, getErrorInfo]);

    useEffect(() => {
        const verifyEmailRequest = async () => {
            // Prevent multiple API calls
            if (hasVerified.current)
                return;

            if (!token) {
                setStatus('error');
                setErrorCode('INVALID_TOKEN');
                toast.error('Invalid token');
                return;
            }

            // Mark as verified to prevent subsequent calls
            hasVerified.current = true;

            try {
                const result = await verifyEmail(token);

                if (result.error) {
                    setStatus('error');
                    setErrorCode(result.error.code as ErrorCode);
                    toast.error(result.message, {
                        description: result.error?.detail
                    });
                } else {
                    setStatus('success');
                    toast.success(result.message);
                }
            } catch {
                setStatus('error');
                setErrorCode('SERVER_ERROR');
                toast.error('An error occurred while verifying email');
            }
        };

        verifyEmailRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Loading state
    if (status === 'loading') {
        return (
            <BeamsBackground>
                <div className="max-w-md w-full space-y-8">
                    <Card className="text-center p-8">
                        <CardContent className="space-y-4">
                            <div className="flex justify-center">
                                <Loader className="h-12 w-12 text-blue-600 animate-spin" />
                            </div>
                            <h2 className="text-xl font-semibold">Verifying email...</h2>
                            <p className="text-muted-foreground">Please wait a moment</p>
                        </CardContent>
                    </Card>
                </div>
            </BeamsBackground>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <BeamsBackground>
                <div className="max-w-md w-full space-y-8">
                    <Card className="text-center">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-center">
                                <div className="bg-green-100 p-4 rounded-full">
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-green-600">
                                    Verification Successful!
                                </h1>
                                <p className="text-muted-foreground">
                                    Your email has been successfully verified. Your account has been activated.
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>You can now log in and use all system features!</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    asChild
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href={`/${locale}/login`}>
                                        Log In Now
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Link href={`/${locale}/`}>
                                        Back to Home
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </BeamsBackground>
        );
    }

    // Error state
    return (
        <BeamsBackground>
            <div className="max-w-md w-full space-y-8">
                <Card className="text-center">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex justify-center">
                            <div className={`${errorInfo.bgColor} p-4 rounded-full`}>
                                {errorInfo.icon}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className={`text-2xl font-bold ${errorInfo.textColor}`}>
                                {errorInfo.title}
                            </h1>
                            <p className="text-muted-foreground">
                                {errorInfo.message}
                            </p>
                        </div>

                        <div className={`${errorInfo.bgColor} border ${errorInfo.borderColor} rounded-lg p-4`}>
                            <div className="flex items-start space-x-3">
                                <Mail className={`h-5 w-5 ${errorInfo.textColor} flex-shrink-0 mt-0.5`} />
                                <div className="text-sm text-left space-y-2">
                                    <p className={`font-medium ${errorInfo.textColor}`}>
                                        Resolution guide:
                                    </p>
                                    <ul className={`${errorInfo.textColor} space-y-1`}>
                                        {errorInfo.instructions.map((instruction, index) => (
                                            <li key={index}>• {instruction}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {errorCode === 'ALREADY_VERIFIED' ? (
                                <Button
                                    asChild
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href={`/${locale}/login`}>
                                        Log In Now
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : errorInfo.showRegisterButton ? (
                                <Button
                                    asChild
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href={`/${locale}/register`}>
                                        Register Again
                                        <Loader className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href={`/${locale}/login`}>
                                        Log In
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}

                            <Button
                                asChild
                                variant="outline"
                                className="w-full"
                            >
                                <Link href={`/${locale}/`}>
                                    Back to Home
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </BeamsBackground>
    );
};

export default EmailVerifiedPage;