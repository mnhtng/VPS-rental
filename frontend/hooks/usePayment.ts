import { apiPattern } from '@/utils/pattern';
import { ApiResponse, OrderPaymentsResponse, PaymentStatusResponse, PaymentResponse, OrderConfirmationEmailData } from '@/types/types';
import { sendOrderConfirmationEmail, sendPasswordResetEmail, sendVerificationMail, sendVPSWelcomeEmail } from '@/lib/email/resend';

const usePayment = () => {
    const proceedToCheckout = async (
        promotionCode: string | null = null
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/checkout-proceed`, {
                method: 'POST',
                body: JSON.stringify({
                    promotion_code: promotionCode,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Proceed to checkout failed',
                    error: {
                        code: 'CHECKOUT_PROCEED_FAILED',
                        detail: result.detail,
                    },
                };
            }

            return {
                message: result.message,
            };
        } catch (error) {
            return {
                message: 'Proceed to checkout failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CHECKOUT_PROCEED_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while proceeding to checkout',
                },
            };
        }
    };

    const createVNPayPayment = async (
        orderNumber: string,
        amount: number,
        phone: string,
        address: string,
        returnUrl?: string,
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/vnpay/create`, {
                method: 'POST',
                body: JSON.stringify({
                    order_number: orderNumber,
                    amount: amount,
                    phone: phone,
                    address: address,
                    return_url: returnUrl,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Create VNPay payment failed',
                    error: {
                        code: 'VNPAY_PAYMENT_ERROR',
                        detail: result.detail,
                    },
                };
            }

            return {
                message: 'Create VNPay payment successful',
                data: result as PaymentResponse,
            };
        } catch (error) {
            return {
                message: 'Create VNPay payment failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VNPAY_PAYMENT_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while creating VNPay payment',
                },
            };
        }
    };

    const createMoMoPayment = async (
        orderNumber: string,
        amount: number,
        phone: string,
        address: string,
        returnUrl?: string
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/momo/create`, {
                method: 'POST',
                body: JSON.stringify({
                    order_number: orderNumber,
                    amount: amount,
                    phone: phone,
                    address: address,
                    return_url: returnUrl,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Create MoMo payment failed',
                    error: {
                        code: 'MOMO_PAYMENT_ERROR',
                        detail: result.detail,
                    },
                };
            }

            return {
                message: 'Create MoMo payment successful',
                data: result as PaymentResponse,
            };
        } catch (error) {
            return {
                message: 'Create MoMo payment failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'MOMO_PAYMENT_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while creating MoMo payment',
                },
            };
        }
    };

    const verifyPayment = async (method: 'momo' | 'vnpay', query: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${method}/return?${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Payment verification failed',
                    error: {
                        code: 'PAYMENT_VERIFICATION_ERROR',
                        detail: result.detail,
                    },
                };
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subtotal = result?.data?.cart.reduce((total: number, item: any) => total + item.total_price, 0);
            const discount = subtotal - result?.data?.order?.price;
            const total = result?.data?.order?.price;

            await sendOrderConfirmationEmail({
                customerName: result?.data?.user?.name,
                customerEmail: result?.data?.user?.email,
                customerPhone: result?.data?.order?.billing_phone,
                customerAddress: result?.data?.order?.billing_address,
                orderNumber: result?.data?.order?.order_number,
                orderDate: new Date(result?.data?.order?.created_at).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                vpsItems: result?.data?.plans.map((item: any, index: number) => {
                    return {
                        name: item?.name,
                        hostname: result?.data?.cart[index]?.hostname,
                        os: result?.data?.cart[index]?.os,
                        duration_months: result?.data?.cart[index]?.duration_months,
                        cpu: item?.vcpu,
                        ram: item?.ram_gb,
                        storage: item?.storage_gb,
                        storage_type: item?.storage_type,
                        network_speed: item?.bandwidth_mbps,
                        price: result?.data?.cart[index]?.unit_price,
                        total_price: result?.data?.cart[index]?.total_price,
                    };
                }),
                subtotal,
                discount,
                total,
                paymentMethod: result?.data?.payment?.payment_method,
                transactionId: result?.transaction_id,
            } as OrderConfirmationEmailData);

            return {
                message: 'Payment verified successfully',
                data: result,
            };
        } catch {
            return {
                message: 'Payment verification failed',
                error: {
                    code: 'PAYMENT_VERIFICATION_ERROR',
                    detail: 'An unexpected error occurred while verifying payment',
                },
            };
        }
    }

    /**
     * Get payment status
     */
    const getPaymentStatus = async (
        paymentId: string
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/${paymentId}`);

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'PAYMENT_STATUS_ERROR',
                        detail: errorData.detail || 'Failed to get payment status',
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
                    detail: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    };

    /**
     * Get order payments
     */
    const getOrderPayments = async (
        orderId: string
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/order/${orderId}`);

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    data: null,
                    error: {
                        code: 'ORDER_PAYMENTS_ERROR',
                        detail: errorData.detail || 'Failed to get order payments',
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
                    detail: error instanceof Error ? error.message : 'Network error',
                },
                message: 'Failed to connect to payment service',
            };
        }
    };

    /**
     * Handle payment redirect (open payment URL in new tab or redirect)
     */
    const redirectToPayment = (
        paymentUrl: string,
        openInNewTab: boolean = false
    ) => {
        if (openInNewTab) {
            window.open(paymentUrl, '_blank');
        } else {
            window.location.href = paymentUrl;
        }
    };

    /**
     * Poll payment status until completed or failed
     */
    const pollPaymentStatus = async (
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
    };

    const processPayment = async (
        orderNumber: string,
        amount: number,
        phone: string,
        address: string,
        returnUrl?: string,
        method: 'vnpay' | 'momo' = 'vnpay',
        openInNewTab: boolean = false
    ): Promise<ApiResponse> => {
        const result = method === 'vnpay'
            ? await createVNPayPayment(orderNumber, amount, phone, address, returnUrl)
            : await createMoMoPayment(orderNumber, amount, phone, address, returnUrl);

        if (result.data?.success && result.data.payment_url) {
            redirectToPayment(result.data.payment_url, openInNewTab);
        }

        return {
            message: result.message,
            data: result.data,
        };
    };

    const checkCanRepay = async (orderId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/order/${orderId}/can-repay`, {
                method: 'GET',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Check repay status failed',
                    error: {
                        code: 'CHECK_REPAY_FAILED',
                        detail: result.detail,
                    },
                };
            }

            return {
                message: 'Check repay status successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Check repay status failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CHECK_REPAY_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while checking repay status',
                },
            };
        }
    };

    const repayOrder = async (
        orderNumber: string,
        amount: number,
        phone: string,
        address: string,
        returnUrl?: string,
        method: 'vnpay' | 'momo' = 'vnpay',
        openInNewTab: boolean = false
    ): Promise<ApiResponse> => {
        try {
            const endpoint = method === 'vnpay'
                ? `${process.env.NEXT_PUBLIC_API_URL}/payments/vnpay/repay`
                : `${process.env.NEXT_PUBLIC_API_URL}/payments/momo/repay`;

            const response = await apiPattern(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    order_number: orderNumber,
                    amount: amount,
                    phone: phone,
                    address: address,
                    return_url: returnUrl,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Repay order failed',
                    error: {
                        code: 'REPAY_ORDER_FAILED',
                        detail: result.detail,
                    },
                };
            }

            if (result?.success && result?.payment_url) {
                redirectToPayment(result.payment_url, openInNewTab);
            }

            return {
                message: 'Repay order successful',
                data: result as PaymentResponse,
            };
        } catch (error) {
            return {
                message: 'Repay order failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'REPAY_ORDER_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while repaying order',
                },
            };
        }
    };

    return {
        proceedToCheckout,
        createMoMoPayment,
        createVNPayPayment,
        processPayment,
        verifyPayment,
        getPaymentStatus,
        getOrderPayments,
        redirectToPayment,
        pollPaymentStatus,
        checkCanRepay,
        repayOrder,
    };
}

export default usePayment;
