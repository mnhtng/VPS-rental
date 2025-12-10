'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Server, AlertTriangle } from 'lucide-react';
import { useLocale } from 'next-intl';
import usePayment from '@/hooks/usePayment';
import { PaymentResult } from '@/types/types';

const VNPayReturnPage = () => {
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyPayment, setupVps } = usePayment();

    const [result, setResult] = useState<PaymentResult>({
        status: 'loading',
        message: 'Verifying transaction...'
    });
    const [setupVpsCompleted, setSetupVpsCompleted] = useState(false);
    const [isSettingUpVps, setIsSettingUpVps] = useState(false);

    // Prevent page close/refresh during VPS setup
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isSettingUpVps) {
                e.preventDefault();
                e.returnValue = 'VPS setup is in progress. Leaving this page may interrupt the process.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSettingUpVps]);

    const handleVerifyPayment = async () => {
        try {
            const vnp_TxnRef = searchParams.get('vnp_TxnRef');
            const vnp_Amount = searchParams.get('vnp_Amount');
            const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');

            const queryString = searchParams.toString();

            // Call backend to verify the signature and payment status
            const result = await verifyPayment("vnpay", queryString);

            if (result.data.valid && result.data.success) {
                setResult({
                    status: 'success',
                    message: "Payment successful! Setting up your VPS...",
                    transactionId: vnp_TransactionNo || result.data.transaction_id,
                    amount: vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' VNĐ' : undefined,
                    orderNumber: vnp_TxnRef || undefined
                });

                // Start VPS setup
                setIsSettingUpVps(true);
                const setupResult = await setupVps(vnp_TxnRef || result.data.transaction_id);
                setIsSettingUpVps(false);

                if (setupResult.error) {
                    setResult(prev => ({
                        ...prev,
                        message: "Payment successful but VPS setup encountered an error. Please contact support."
                    }));
                } else {
                    setResult(prev => ({
                        ...prev,
                        message: "Payment successful! Your VPS is being activated."
                    }));
                    setSetupVpsCompleted(true);
                }

            } else {
                let errorMessage = 'Payment failed';

                // Map VNPay response codes to messages
                if (result.data.message) {
                    errorMessage = result.data.message;
                }

                setResult({
                    status: 'failed',
                    message: errorMessage,
                    orderNumber: vnp_TxnRef || undefined
                });
            }
        } catch {
            setResult({
                status: 'failed',
                message: 'Unable to verify the transaction'
            });
        }
    };

    useEffect(() => {
        handleVerifyPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        {result.status === 'success' && !setupVpsCompleted && isSettingUpVps && (
                            <div className="bg-orange-500 p-4 rounded-full">
                                <Server className="h-8 w-8 text-white animate-pulse" />
                            </div>
                        )}
                        {result.status === 'success' && (setupVpsCompleted || !isSettingUpVps) && (
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
                        {result.status === 'loading'
                            ? 'Processing Payment...'
                            : result.status === 'success'
                                ? (isSettingUpVps ? 'Setting Up VPS...' : 'Payment Successful')
                                : 'Payment Failed'
                        }
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{result.message}</p>

                    {result.status === 'success' && isSettingUpVps && (
                        <>
                            <div className="flex items-center justify-center gap-2 text-orange-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Provisioning your VPS on our servers...</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                <span className="text-sm text-amber-700 dark:text-amber-300">
                                    Please do not close or refresh this page during setup.
                                </span>
                            </div>
                        </>
                    )}

                    {result.status === 'success' && (
                        <div className="space-y-3">
                            {result.orderNumber && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                                    <p className="text-lg font-mono font-bold">{result.orderNumber}</p>
                                </div>
                            )}
                            {result.transactionId && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">VNPay Transaction ID</p>
                                    <p className="text-lg font-mono">{result.transactionId}</p>
                                </div>
                            )}
                            {result.amount && (
                                <div className="bg-secondary p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                                    <p className="text-lg font-bold text-green-600">{result.amount}</p>
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground mt-4">
                                You will receive a confirmation email with detailed information about the VPS.
                            </p>
                        </div>
                    )}

                    {result.status === 'failed' && result.orderNumber && (
                        <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                            <p className="text-lg font-mono">{result.orderNumber}</p>
                        </div>
                    )}

                    <div className="space-y-2 pt-4">
                        {result.status === 'success' ? (
                            <>
                                <Button
                                    className="w-full bg-gradient-to-r from-green-500 to-sky-500 hover:from-green-600 hover:to-sky-600"
                                    onClick={() => router.push(`/${locale}/client-dashboard`)}
                                    disabled={isSettingUpVps}
                                >
                                    {isSettingUpVps ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Setting up VPS...
                                        </>
                                    ) : (
                                        'Go to Dashboard'
                                    )}
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/plans`)} disabled={isSettingUpVps}>
                                    Continue Shopping
                                </Button>
                            </>
                        ) : result.status === 'failed' ? (
                            <>
                                <Button className="w-full bg-gradient-to-r from-green-500 to-sky-500 hover:from-green-600 hover:to-sky-600" onClick={() => router.push(`/${locale}/checkout`)}>
                                    Retry
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/`)}>
                                    Go to Home
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


