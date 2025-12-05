'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

type PaymentStatus = 'loading' | 'success' | 'failed';

interface PaymentResult {
    status: PaymentStatus;
    message: string;
    transactionId?: string;
    amount?: string;
    orderNumber?: string;
}

const VNPayReturnPage: React.FC = () => {
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [result, setResult] = useState<PaymentResult>({
        status: 'loading',
        message: 'Đang xác minh giao dịch...'
    });

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get all query params from VNPay redirect
                const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
                const vnp_TxnRef = searchParams.get('vnp_TxnRef');
                const vnp_Amount = searchParams.get('vnp_Amount');
                const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');

                // Build query string for backend verification
                const queryString = searchParams.toString();

                // Call backend to verify the signature and payment status
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                const response = await fetch(`${API_URL}/payments/vnpay/return?${queryString}`);
                const data = await response.json();

                if (data.valid && data.success) {
                    // Payment successful
                    localStorage.removeItem('vps_cart');
                    setResult({
                        status: 'success',
                        message: 'Thanh toán thành công!',
                        transactionId: vnp_TransactionNo || data.transaction_id,
                        amount: vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' VNĐ' : undefined,
                        orderNumber: vnp_TxnRef || undefined
                    });
                } else {
                    // Payment failed or invalid
                    let errorMessage = 'Thanh toán thất bại';

                    // Map VNPay response codes to messages
                    if (vnp_ResponseCode === '24') {
                        errorMessage = 'Khách hàng đã hủy giao dịch';
                    } else if (vnp_ResponseCode === '11') {
                        errorMessage = 'Giao dịch không thành công do quá thời gian chờ';
                    } else if (vnp_ResponseCode === '12') {
                        errorMessage = 'Thẻ/Tài khoản bị khóa';
                    } else if (vnp_ResponseCode === '75') {
                        errorMessage = 'Ngân hàng đang bảo trì';
                    } else if (data.message) {
                        errorMessage = data.message;
                    }

                    setResult({
                        status: 'failed',
                        message: errorMessage,
                        orderNumber: vnp_TxnRef || undefined
                    });
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setResult({
                    status: 'failed',
                    message: 'Không thể xác minh giao dịch. Vui lòng liên hệ hỗ trợ.'
                });
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {result.status === 'loading' && (
                            <div className="bg-blue-500 p-4 rounded-full">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                        )}
                        {result.status === 'success' && (
                            <div className="bg-green-500 p-4 rounded-full">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                        )}
                        {result.status === 'failed' && (
                            <div className="bg-red-500 p-4 rounded-full">
                                <XCircle className="h-8 w-8 text-white" />
                            </div>
                        )}
                    </div>
                    <CardTitle className={`text-2xl ${result.status === 'success' ? 'text-green-500' :
                        result.status === 'failed' ? 'text-red-500' :
                            'text-blue-500'
                        }`}>
                        {result.status === 'loading' ? 'Đang xử lý...' :
                            result.status === 'success' ? 'Thanh toán thành công!' :
                                'Thanh toán thất bại'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{result.message}</p>

                    {result.status === 'success' && (
                        <div className="space-y-3">
                            {result.orderNumber && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Mã đơn hàng</p>
                                    <p className="text-lg font-mono font-bold">{result.orderNumber}</p>
                                </div>
                            )}
                            {result.transactionId && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Mã giao dịch VNPay</p>
                                    <p className="text-lg font-mono">{result.transactionId}</p>
                                </div>
                            )}
                            {result.amount && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Số tiền</p>
                                    <p className="text-lg font-bold text-green-600">{result.amount}</p>
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground mt-4">
                                Bạn sẽ nhận được email xác nhận với thông tin chi tiết về VPS.
                            </p>
                        </div>
                    )}

                    {result.status === 'failed' && result.orderNumber && (
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Mã đơn hàng</p>
                            <p className="text-lg font-mono">{result.orderNumber}</p>
                        </div>
                    )}

                    <div className="space-y-2 pt-4">
                        {result.status === 'success' ? (
                            <>
                                <Button className="w-full" onClick={() => router.push(`/${locale}/client-dashboard`)}>
                                    Đi đến Dashboard
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/plans`)}>
                                    Tiếp tục mua sắm
                                </Button>
                            </>
                        ) : result.status === 'failed' ? (
                            <>
                                <Button className="w-full" onClick={() => router.push('/checkout')}>
                                    Thử lại
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                                    Về trang chủ
                                </Button>
                            </>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VNPayReturnPage;
