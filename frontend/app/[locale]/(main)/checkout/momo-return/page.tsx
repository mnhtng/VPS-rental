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
    momoTransId?: string;
    amount?: string;
    orderNumber?: string;
}

const MoMoReturnPage: React.FC = () => {
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [result, setResult] = useState<PaymentResult>({
        status: 'loading',
        message: 'Đang xác minh giao dịch MoMo...'
    });

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get MoMo return params
                const resultCode = searchParams.get('resultCode');
                const orderId = searchParams.get('orderId');
                const amount = searchParams.get('amount');
                const transId = searchParams.get('transId');
                const momoMessage = searchParams.get('message');

                // Build query string for backend verification  
                const queryString = searchParams.toString();

                // Call backend to verify the signature and payment status
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
                const response = await fetch(`${API_URL}/payments/momo/return?${queryString}`);
                const data = await response.json();

                if (data.valid && data.success) {
                    // Payment successful
                    localStorage.removeItem('vps_cart');
                    setResult({
                        status: 'success',
                        message: 'Thanh toán MoMo thành công!',
                        transactionId: orderId || data.transaction_id,
                        momoTransId: transId || data.momo_trans_id,
                        amount: amount ? parseInt(amount).toLocaleString('vi-VN') + ' VNĐ' : undefined,
                        orderNumber: orderId || undefined
                    });
                } else {
                    // Payment failed or invalid
                    let errorMessage = 'Thanh toán thất bại';

                    // Map MoMo result codes to messages
                    if (resultCode === '1006') {
                        errorMessage = 'Người dùng từ chối xác nhận thanh toán';
                    } else if (resultCode === '1005') {
                        errorMessage = 'Giao dịch đã hết hạn';
                    } else if (resultCode === '1004') {
                        errorMessage = 'Số tiền thanh toán không hợp lệ';
                    } else if (resultCode === '1003') {
                        errorMessage = 'Giao dịch bị từ chối bởi nhà cung cấp';
                    } else if (momoMessage) {
                        errorMessage = momoMessage;
                    } else if (data.message) {
                        errorMessage = data.message;
                    }

                    setResult({
                        status: 'failed',
                        message: errorMessage,
                        orderNumber: orderId || undefined
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
                            <div className="bg-pink-500 p-4 rounded-full">
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
                    <CardTitle className={`text-2xl ${result.status === 'success' ? 'text-pink-500' :
                        result.status === 'failed' ? 'text-red-500' :
                            'text-pink-500'
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
                            {result.momoTransId && (
                                <div className="bg-pink-50 dark:bg-pink-950/30 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                                    <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Mã giao dịch MoMo</p>
                                    <p className="text-lg font-mono font-bold text-pink-700 dark:text-pink-300">{result.momoTransId}</p>
                                </div>
                            )}
                            {result.amount && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Số tiền</p>
                                    <p className="text-lg font-bold text-pink-600">{result.amount}</p>
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
                                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" onClick={() => router.push(`/${locale}/client-dashboard`)}>
                                    Đi đến Dashboard
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/plans`)}>
                                    Tiếp tục mua sắm
                                </Button>
                            </>
                        ) : result.status === 'failed' ? (
                            <>
                                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" onClick={() => router.push(`/${locale}/checkout`)}>
                                    Thử lại
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}`)}>
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

export default MoMoReturnPage;
