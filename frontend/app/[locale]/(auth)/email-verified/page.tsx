'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
    CheckCircle, 
    XCircle, 
    Mail, 
    ArrowRight, 
    RefreshCw,
    AlertTriangle 
} from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beam-background';

const EmailVerifiedPage = () => {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const code = searchParams.get('code');

    useEffect(() => {
        // Add a small delay to show loading state
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <BeamsBackground>
                <div className="max-w-md w-full space-y-8">
                    <Card className="text-center p-8">
                        <CardContent className="space-y-4">
                            <div className="flex justify-center">
                                <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
                            </div>
                            <h2 className="text-xl font-semibold">Đang xác minh email...</h2>
                            <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
                        </CardContent>
                    </Card>
                </div>
            </BeamsBackground>
        );
    }

    // Success case
    if (success === 'true') {
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
                                    Xác minh thành công!
                                </h1>
                                <p className="text-muted-foreground">
                                    Email của bạn đã được xác minh thành công. Tài khoản của bạn đã được kích hoạt.
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>Bạn có thể đăng nhập và sử dụng tất cả tính năng của VPS Rental ngay bây giờ!</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button 
                                    asChild 
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href="/login">
                                        Đăng nhập ngay
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>

                                <Button 
                                    asChild 
                                    variant="outline" 
                                    className="w-full"
                                >
                                    <Link href="/">
                                        Về trang chủ
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </BeamsBackground>
        );
    }

    // Error cases
    const getErrorInfo = () => {
        switch (code) {
            case 'INVALID_TOKEN':
                return {
                    icon: <XCircle className="h-12 w-12 text-red-600" />,
                    title: 'Link xác minh không hợp lệ',
                    message: 'Link xác minh đã hết hạn hoặc không hợp lệ. Vui lòng thử đăng ký lại.',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-600',
                    borderColor: 'border-red-200',
                    showRegisterButton: true
                };
            case 'USER_NOT_FOUND':
                return {
                    icon: <AlertTriangle className="h-12 w-12 text-orange-600" />,
                    title: 'Không tìm thấy tài khoản',
                    message: 'Tài khoản liên kết với email này không tồn tại. Vui lòng đăng ký lại.',
                    bgColor: 'bg-orange-100',
                    textColor: 'text-orange-600',
                    borderColor: 'border-orange-200',
                    showRegisterButton: true
                };
            case 'ALREADY_VERIFIED':
                return {
                    icon: <CheckCircle className="h-12 w-12 text-blue-600" />,
                    title: 'Email đã được xác minh',
                    message: 'Email này đã được xác minh trước đó. Bạn có thể đăng nhập ngay.',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-600',
                    borderColor: 'border-blue-200',
                    showRegisterButton: false
                };
            case 'SERVER_ERROR':
            default:
                return {
                    icon: <XCircle className="h-12 w-12 text-red-600" />,
                    title: 'Đã xảy ra lỗi',
                    message: error || 'Có lỗi xảy ra trong quá trình xác minh. Vui lòng thử lại sau.',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-600',
                    borderColor: 'border-red-200',
                    showRegisterButton: true
                };
        }
    };

    const errorInfo = getErrorInfo();

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
                                        Hướng dẫn giải quyết:
                                    </p>
                                    <ul className={`${errorInfo.textColor} space-y-1`}>
                                        {code === 'INVALID_TOKEN' && (
                                            <>
                                                <li>• Link có thể đã hết hạn (24 giờ)</li>
                                                <li>• Đăng ký lại để nhận link mới</li>
                                                <li>• Kiểm tra link có đầy đủ không</li>
                                            </>
                                        )}
                                        {code === 'USER_NOT_FOUND' && (
                                            <>
                                                <li>• Tài khoản có thể đã bị xóa</li>
                                                <li>• Đăng ký với email chính xác</li>
                                            </>
                                        )}
                                        {code === 'ALREADY_VERIFIED' && (
                                            <>
                                                <li>• Tài khoản đã sẵn sàng sử dụng</li>
                                                <li>• Đăng nhập với email và mật khẩu</li>
                                            </>
                                        )}
                                        {(code === 'SERVER_ERROR' || !code) && (
                                            <>
                                                <li>• Thử lại sau vài phút</li>
                                                <li>• Liên hệ hỗ trợ nếu vẫn lỗi</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {code === 'ALREADY_VERIFIED' ? (
                                <Button 
                                    asChild 
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href="/login">
                                        Đăng nhập ngay
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : errorInfo.showRegisterButton ? (
                                <Button 
                                    asChild 
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href="/register">
                                        Đăng ký lại
                                        <RefreshCw className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button 
                                    asChild 
                                    className="w-full"
                                    size="lg"
                                >
                                    <Link href="/login">
                                        Đăng nhập
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}

                            <Button 
                                asChild 
                                variant="outline" 
                                className="w-full"
                            >
                                <Link href="/">
                                    Về trang chủ
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