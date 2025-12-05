import { useCallback } from 'react';

// Types
interface PaymentResponse {
    success: boolean;
    payment_url?: string;
    qr_code_url?: string;
    deeplink?: string;
    transaction_id?: string;
    payment_id?: string;
    error?: string;
}

interface PaymentStatusResponse {
    payment_id: string;
    transaction_id: string | null;
    payment_method: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    order_id: string | null;
    order_number: string | null;
    order_status: string | null;
    created_at: string;
    updated_at: string;
}

interface OrderPaymentsResponse {
    order_id: string;
    order_number: string;
    order_status: string;
    payments: Array<{
        id: string;
        transaction_id: string | null;
        payment_method: string;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
    }>;
}

interface VNPayBank {
    code: string;
    name: string;
}

interface ApiResult<T> {
    data: T | null;
    error: {
        code: string;
        details: string;
    } | null;
    message: string;
}

export function usePayment() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    /**
     * Make authenticated API request using cookies
     */
    const fetchWithAuth = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',  // Use cookies for auth
        });

        return response;
    }, []);

    /**
     * Create MoMo payment
     */
    const createMoMoPayment = useCallback(async (
        orderId: string,
        returnUrl?: string
    ): Promise<ApiResult<PaymentResponse>> => {
        try {
            const response = await fetchWithAuth(`${API_URL}/payments/momo/create`, {
                method: 'POST',
                body: JSON.stringify({
                    order_id: orderId,
                    return_url: returnUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'MOMO_PAYMENT_ERROR',
                        details: errorData.detail || 'Failed to create MoMo payment',
                    },
                    message: 'Failed to create MoMo payment',
                };
            }

            const data: PaymentResponse = await response.json();
            return {
                data,
                error: null,
                message: 'MoMo payment created successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [fetchWithAuth, API_URL]);

    /**
     * Create Demo VNPay payment (for testing without real order)
     */
    const createDemoVNPayPayment = useCallback(async (
        orderNumber: string,
        amount: number,
        returnUrl?: string,
        bankCode?: string
    ): Promise<ApiResult<PaymentResponse>> => {
        try {
            const response = await fetch(`${API_URL}/payments/demo/vnpay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_number: orderNumber,
                    amount: amount,
                    return_url: returnUrl,
                    bank_code: bankCode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'VNPAY_PAYMENT_ERROR',
                        details: errorData.detail || 'Failed to create demo VNPay payment',
                    },
                    message: 'Failed to create demo VNPay payment',
                };
            }

            const data: PaymentResponse = await response.json();
            return {
                data,
                error: null,
                message: 'Demo VNPay payment created successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [API_URL]);

    /**
     * Create Demo MoMo payment (for testing without real order)
     */
    const createDemoMoMoPayment = useCallback(async (
        orderNumber: string,
        amount: number,
        returnUrl?: string
    ): Promise<ApiResult<PaymentResponse>> => {
        try {
            const response = await fetch(`${API_URL}/payments/demo/momo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_number: orderNumber,
                    amount: amount,
                    return_url: returnUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'MOMO_PAYMENT_ERROR',
                        details: errorData.detail || 'Failed to create demo MoMo payment',
                    },
                    message: 'Failed to create demo MoMo payment',
                };
            }

            const data: PaymentResponse = await response.json();
            return {
                data,
                error: null,
                message: 'Demo MoMo payment created successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [API_URL]);

    /**
     * Create VNPay payment
     */
    const createVNPayPayment = useCallback(async (
        orderId: string,
        returnUrl?: string,
        bankCode?: string
    ): Promise<ApiResult<PaymentResponse>> => {
        try {
            const response = await fetchWithAuth(`${API_URL}/payments/vnpay/create`, {
                method: 'POST',
                body: JSON.stringify({
                    order_id: orderId,
                    return_url: returnUrl,
                    bank_code: bankCode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'VNPAY_PAYMENT_ERROR',
                        details: errorData.detail || 'Failed to create VNPay payment',
                    },
                    message: 'Failed to create VNPay payment',
                };
            }

            const data: PaymentResponse = await response.json();
            return {
                data,
                error: null,
                message: 'VNPay payment created successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [fetchWithAuth, API_URL]);

    /**
     * Get payment status
     */
    const getPaymentStatus = useCallback(async (
        paymentId: string
    ): Promise<ApiResult<PaymentStatusResponse>> => {
        try {
            const response = await fetchWithAuth(`${API_URL}/payments/${paymentId}`);

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'PAYMENT_STATUS_ERROR',
                        details: errorData.detail || 'Failed to get payment status',
                    },
                    message: 'Failed to get payment status',
                };
            }

            const data: PaymentStatusResponse = await response.json();
            return {
                data,
                error: null,
                message: 'Payment status retrieved successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [fetchWithAuth, API_URL]);

    /**
     * Get order payments
     */
    const getOrderPayments = useCallback(async (
        orderId: string
    ): Promise<ApiResult<OrderPaymentsResponse>> => {
        try {
            const response = await fetchWithAuth(`${API_URL}/payments/order/${orderId}`);

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'ORDER_PAYMENTS_ERROR',
                        details: errorData.detail || 'Failed to get order payments',
                    },
                    message: 'Failed to get order payments',
                };
            }

            const data: OrderPaymentsResponse = await response.json();
            return {
                data,
                error: null,
                message: 'Order payments retrieved successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [fetchWithAuth, API_URL]);

    /**
     * Get VNPay bank list
     */
    const getVNPayBanks = useCallback(async (): Promise<ApiResult<VNPayBank[]>> => {
        try {
            const response = await fetch(`${API_URL}/payments/vnpay/banks`);

            if (!response.ok) {
                return {
                    data: null,
                    error: {
                        code: 'BANKS_FETCH_ERROR',
                        details: 'Failed to fetch bank list',
                    },
                    message: 'Failed to fetch bank list',
                };
            }

            const data = await response.json();
            return {
                data: data.banks,
                error: null,
                message: 'Banks retrieved successfully',
            };
        } catch (error) {
            return {
                data: null,
                error: {
                    code: 'NETWORK_ERROR',
                    details: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    }, [API_URL]);

    /**
     * Handle payment redirect (open payment URL in new tab or redirect)
     */
    const redirectToPayment = useCallback((
        paymentUrl: string,
        openInNewTab: boolean = false
    ) => {
        if (openInNewTab) {
            window.open(paymentUrl, '_blank');
        } else {
            window.location.href = paymentUrl;
        }
    }, []);

    /**
     * Process MoMo payment - create and redirect
     */
    const processMoMoPayment = useCallback(async (
        orderId: string,
        returnUrl?: string,
        openInNewTab: boolean = false
    ): Promise<ApiResult<PaymentResponse>> => {
        const result = await createMoMoPayment(orderId, returnUrl);

        if (result.data?.success && result.data.payment_url) {
            redirectToPayment(result.data.payment_url, openInNewTab);
        }

        return result;
    }, [createMoMoPayment, redirectToPayment]);

    /**
     * Process VNPay payment - create and redirect
     */
    const processVNPayPayment = useCallback(async (
        orderId: string,
        returnUrl?: string,
        bankCode?: string,
        openInNewTab: boolean = false
    ): Promise<ApiResult<PaymentResponse>> => {
        const result = await createVNPayPayment(orderId, returnUrl, bankCode);

        if (result.data?.success && result.data.payment_url) {
            redirectToPayment(result.data.payment_url, openInNewTab);
        }

        return result;
    }, [createVNPayPayment, redirectToPayment]);

    /**
     * Poll payment status until completed or failed
     */
    const pollPaymentStatus = useCallback(async (
        paymentId: string,
        onStatusChange?: (status: PaymentStatusResponse) => void,
        intervalMs: number = 3000,
        maxAttempts: number = 60
    ): Promise<PaymentStatusResponse | null> => {
        let attempts = 0;

        return new Promise((resolve) => {
            const checkStatus = async () => {
                attempts++;
                const result = await getPaymentStatus(paymentId);

                if (result.data) {
                    onStatusChange?.(result.data);

                    if (result.data.status === 'completed' || result.data.status === 'failed') {
                        resolve(result.data);
                        return;
                    }
                }

                if (attempts >= maxAttempts) {
                    resolve(result.data);
                    return;
                }

                setTimeout(checkStatus, intervalMs);
            };

            checkStatus();
        });
    }, [getPaymentStatus]);

    /**
     * Process Demo VNPay payment - create and redirect
     */
    const processDemoVNPayPayment = useCallback(async (
        orderNumber: string,
        amount: number,
        returnUrl?: string,
        bankCode?: string,
        openInNewTab: boolean = false
    ): Promise<ApiResult<PaymentResponse>> => {
        const result = await createDemoVNPayPayment(orderNumber, amount, returnUrl, bankCode);

        if (result.data?.success && result.data.payment_url) {
            redirectToPayment(result.data.payment_url, openInNewTab);
        }

        return result;
    }, [createDemoVNPayPayment, redirectToPayment]);

    /**
     * Process Demo MoMo payment - create and redirect
     */
    const processDemoMoMoPayment = useCallback(async (
        orderNumber: string,
        amount: number,
        returnUrl?: string,
        openInNewTab: boolean = false
    ): Promise<ApiResult<PaymentResponse>> => {
        const result = await createDemoMoMoPayment(orderNumber, amount, returnUrl);

        if (result.data?.success && result.data.payment_url) {
            redirectToPayment(result.data.payment_url, openInNewTab);
        }

        return result;
    }, [createDemoMoMoPayment, redirectToPayment]);

    return {
        // MoMo
        createMoMoPayment,
        processMoMoPayment,

        // VNPay
        createVNPayPayment,
        processVNPayPayment,
        getVNPayBanks,

        // Demo/Test payments (no real order required)
        createDemoVNPayPayment,
        createDemoMoMoPayment,
        processDemoVNPayPayment,
        processDemoMoMoPayment,

        // Common
        getPaymentStatus,
        getOrderPayments,
        redirectToPayment,
        pollPaymentStatus,
    };
}
