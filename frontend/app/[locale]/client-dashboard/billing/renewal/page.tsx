'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw, Calendar, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';
import usePayment from '@/hooks/usePayment';
import { formatPrice } from '@/utils/currency';
import { formatDateTime } from '@/utils/string';

interface RenewalResult {
    status: 'loading' | 'success' | 'failed';
    message: string;
    transactionId?: string;
    momoTransId?: string;
    amount?: string;
    orderNumber?: string;
    vpsInfo?: {
        hostname?: string;
        newExpiryDate?: string;
        planName?: string;
    };
}

const RenewalReturnContent = () => {
    const t = useTranslations('renewal');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyRenewalPayment } = usePayment();

    const [result, setResult] = useState<RenewalResult>({
        status: 'loading',
        message: t('verifying')
    });

    // Detect payment method from query parameters
    const detectPaymentMethod = (): 'vnpay' | 'momo' => {
        if (searchParams.get('vnp_TxnRef')) {
            return 'vnpay';
        }
        if (searchParams.get('orderId')) {
            return 'momo';
        }
        return 'vnpay';
    };

    const handleVerifyPayment = async () => {
        try {
            const method = detectPaymentMethod();
            const queryString = searchParams.toString();

            const response = await verifyRenewalPayment(method, queryString);

            if (response.data?.valid && response.data?.success) {
                const vpsInstance = response.data?.data?.vps_instance;
                const order = response.data?.data?.order;

                let transactionId: string | undefined;
                let momoTransId: string | undefined;
                let amount: string | undefined;

                if (method === 'vnpay') {
                    transactionId = searchParams.get('vnp_TransactionNo') || response.data?.transaction_id;
                    const vnpAmount = searchParams.get('vnp_Amount');
                    amount = vnpAmount ? formatPrice(parseInt(vnpAmount) / 100) : undefined;
                } else {
                    momoTransId = searchParams.get('transId') || response.data?.transaction_id;
                    const momoAmount = searchParams.get('amount');
                    amount = momoAmount ? formatPrice(parseInt(momoAmount)) : undefined;
                }

                setResult({
                    status: 'success',
                    message: t('success_message'),
                    transactionId,
                    momoTransId,
                    amount,
                    orderNumber: order?.order_number,
                    vpsInfo: {
                        hostname: vpsInstance?.vm?.hostname,
                        newExpiryDate: vpsInstance?.expires_at,
                        planName: vpsInstance?.vps_plan?.name,
                    }
                });
            } else {
                let errorMessage = t('failed_message');

                if (response.data?.message) {
                    errorMessage = response.data.message;
                } else if (response.error?.detail) {
                    errorMessage = response.error.detail;
                }

                const orderNumber = method === 'vnpay'
                    ? searchParams.get('vnp_TxnRef') || undefined
                    : searchParams.get('orderId') || undefined;

                setResult({
                    status: 'failed',
                    message: errorMessage,
                    orderNumber,
                });
            }
        } catch {
            setResult({
                status: 'failed',
                message: t('verify_failed')
            });
        }
    };

    useEffect(() => {
        handleVerifyPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const paymentMethod = detectPaymentMethod();
    const primaryColor = paymentMethod === 'momo' ? 'pink' : 'blue';
    const gradientClasses = paymentMethod === 'momo'
        ? 'from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
        : 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600';

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {result.status === 'loading' && (
                            <div className={`bg-${primaryColor}-500 p-4 rounded-full`}>
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
                            `text-${primaryColor}-500`
                        }`}>
                        {result.status === 'loading'
                            ? t('processing')
                            : result.status === 'success'
                                ? t('renewal_successful')
                                : t('renewal_failed')
                        }
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{result.message}</p>

                    {result.status === 'success' && (
                        <div className="space-y-3">
                            {/* VPS Info */}
                            {result.vpsInfo?.hostname && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Server className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-medium text-muted-foreground">{t('vps_label')}</p>
                                    </div>
                                    <p className="text-lg font-bold">{result.vpsInfo.hostname}</p>
                                    {result.vpsInfo.planName && (
                                        <p className="text-sm text-muted-foreground">{result.vpsInfo.planName}</p>
                                    )}
                                </div>
                            )}

                            {/* New Expiry Date */}
                            {result.vpsInfo?.newExpiryDate && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-medium text-muted-foreground">{t('new_expiry_date')}</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatDateTime(new Date(result.vpsInfo.newExpiryDate))}
                                    </p>
                                </div>
                            )}

                            {/* Order Number */}
                            {result.orderNumber && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">{t('order_number')}</p>
                                    <p className="text-lg font-mono font-bold">{result.orderNumber}</p>
                                </div>
                            )}

                            {/* Transaction ID */}
                            {result.transactionId && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">{t('vnpay_transaction_id')}</p>
                                    <p className="text-lg font-mono">{result.transactionId}</p>
                                </div>
                            )}
                            {result.momoTransId && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">{t('momo_transaction_id')}</p>
                                    <p className="text-lg font-mono font-bold">{result.momoTransId}</p>
                                </div>
                            )}

                            {/* Amount */}
                            {result.amount && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">{t('amount')}</p>
                                    <p className={`text-lg font-bold text-${paymentMethod === 'momo' ? 'pink' : 'blue'}-600`}>
                                        {result.amount}
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground mt-4">
                                {t('success_description')}
                            </p>
                        </div>
                    )}

                    {result.status === 'failed' && result.orderNumber && (
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">{t('order_number')}</p>
                            <p className="text-lg font-mono">{result.orderNumber}</p>
                        </div>
                    )}

                    <div className="space-y-2 pt-4">
                        {result.status === 'success' ? (
                            <>
                                <Button
                                    className={`w-full bg-linear-to-r ${gradientClasses}`}
                                    onClick={() => router.push(`/client-dashboard/billing`)}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t('back_to_billing')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push(`/client-dashboard`)}
                                >
                                    {t('go_to_dashboard')}
                                </Button>
                            </>
                        ) : result.status === 'failed' ? (
                            <>
                                <Button
                                    className={`w-full bg-linear-to-r ${gradientClasses}`}
                                    onClick={() => router.push(`/client-dashboard/billing`)}
                                >
                                    {t('try_again')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push(`/client-dashboard`)}
                                >
                                    {t('go_to_dashboard')}
                                </Button>
                            </>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const RenewalReturnPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <Card className="max-w-md w-full">
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </CardContent>
                </Card>
            </div>
        }>
            <RenewalReturnContent />
        </Suspense>
    );
};

export default RenewalReturnPage;
