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
    AlertCircle
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

const ForgotPasswordPage = () => {
    const router = useRouter();
    const { forgotPassword } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = new FormData(e.target as HTMLFormElement);
        const formData = {
            email: submitData.get('email') as string,
        };

        try {
            // Validate form
            if (!formData.email) {
                throw new Error('Vui lòng nhập địa chỉ email');
            }

            // Call forgot password API
            const result = await forgotPassword(formData.email);

            if (result.success) {
                setEmail(formData.email);
                setIsSuccess(true);
                toast.success(result.message || 'Email đặt lại mật khẩu đã được gửi!');
            } else {
                toast.error(result.message || 'Có lỗi xảy ra khi gửi email');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

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
                            Email đã được gửi!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn
                        </p>
                    </div>

                    {/* Success Card */}
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        Email đã được gửi tới:
                                    </p>
                                    <p className="font-medium text-green-800 dark:text-green-300">
                                        {email}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>• Kiểm tra hộp thư của bạn và click vào link đặt lại mật khẩu</p>
                                    <p>• Link sẽ hết hạn sau 1 giờ</p>
                                    <p>• Kiểm tra cả thư mục spam nếu không thấy email</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setEmail('');
                                    }}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Gửi lại email
                                </Button>

                                <Button
                                    onClick={() => router.push('/login')}
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
                        Quên mật khẩu?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Không sao cả! Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
                    </p>
                </div>

                {/* Forgot Password Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Đặt lại mật khẩu</CardTitle>
                        <CardDescription className="text-center">
                            Nhập địa chỉ email đăng ký tài khoản của bạn
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
                                        placeholder="Nhập email của bạn"
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
                                {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
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

export default ForgotPasswordPage;