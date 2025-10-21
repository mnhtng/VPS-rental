'use client';

import React, { useState, useEffect } from 'react';
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
    ArrowLeft
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

const ResetPasswordPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword, validateResetToken } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // Validate token on component mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token || !email) {
                setIsValidating(false);
                setIsValidToken(false);
                return;
            }

            try {
                const result = await validateResetToken(token, email);

                if (result.success) {
                    setIsValidToken(true);
                } else {
                    setIsValidToken(false);
                    toast.error(result.message || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
                }
            } catch {
                setIsValidToken(false);
                toast.error('Có lỗi xảy ra khi xác thực link');
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token, email, validateResetToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = new FormData(e.target as HTMLFormElement);
        const formData = {
            password: submitData.get('password') as string,
            confirmPassword: submitData.get('confirmPassword') as string,
        };

        try {
            // Validate form
            if (!formData.password || !formData.confirmPassword) {
                throw new Error('Vui lòng nhập đầy đủ thông tin');
            }

            if (formData.password !== formData.confirmPassword) {
                throw new Error('Mật khẩu xác nhận không khớp');
            }

            if (formData.password.length < 6) {
                throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
            }

            if (!token || !email) {
                throw new Error('Thông tin đặt lại mật khẩu không hợp lệ');
            }

            // Call reset password API
            const result = await resetPassword(token, email, formData.password, formData.confirmPassword);

            if (result.success) {
                setIsSuccess(true);
                toast.success(result.message || 'Mật khẩu đã được đặt lại thành công!');
            } else {
                toast.error(result.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
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
                                    Đang xác thực link đặt lại mật khẩu...
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
                            Link không hợp lệ
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn
                        </p>
                    </div>

                    {/* Invalid Token Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        Link có thể đã hết hạn (1 giờ) hoặc đã được sử dụng
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>• Link đặt lại mật khẩu chỉ có hiệu lực trong 1 giờ</p>
                                    <p>• Mỗi link chỉ có thể sử dụng một lần</p>
                                    <p>• Vui lòng yêu cầu link mới nếu cần</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push('/forgot-password')}
                                    className="w-full"
                                >
                                    Yêu cầu link mới
                                </Button>

                                <Button
                                    onClick={() => router.push('/login')}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Quay về đăng nhập
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
                            Đặt lại mật khẩu thành công!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Mật khẩu của bạn đã được cập nhật thành công
                        </p>
                    </div>

                    {/* Success Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.push('/login')}
                                className="w-full"
                            >
                                Đăng nhập ngay
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
                        Đặt mật khẩu mới
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Nhập mật khẩu mới cho tài khoản <span className="font-medium">{email}</span>
                    </p>
                </div>

                {/* Reset Password Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Tạo mật khẩu mới</CardTitle>
                        <CardDescription className="text-center">
                            Mật khẩu phải có ít nhất 6 ký tự
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu mới</Label>
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
                                        placeholder="Nhập mật khẩu mới"
                                        className="pl-10 pr-10"
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
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

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
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
                                        placeholder="Nhập lại mật khẩu mới"
                                        className="pl-10 pr-10"
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
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

                            {/* Password Requirements */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
                                    Yêu cầu mật khẩu:
                                </p>
                                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                                    <li>• Ít nhất 6 ký tự</li>
                                    <li>• Nên kết hợp chữ và số</li>
                                    <li>• Không sử dụng thông tin cá nhân dễ đoán</li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                            </Button>
                        </form>

                        {/* Back to Login */}
                        <div className="text-center">
                            <Link
                                href="/login"
                                className={cn(
                                    "text-sm text-blue-600 hover:text-blue-500 inline-flex items-center",
                                    isLoading && "pointer-events-none select-none"
                                )}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay về đăng nhập
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPasswordPage;