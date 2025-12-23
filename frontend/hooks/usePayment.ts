import { apiPattern } from '@/utils/pattern';
import { ApiResponse, OrderPaymentsResponse, PaymentStatusResponse, PaymentResponse, OrderConfirmationEmailData } from '@/types/types';
import { sendOrderConfirmationEmail } from '@/lib/email/resend';

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

            const cartItems = result?.data?.cart || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subtotal = cartItems.reduce((total: number, item: any) => total + (item.total_price || 0), 0);
            const total = result?.data?.order?.price || 0;
            const discount = subtotal > total ? subtotal - total : 0;

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
                    const cartItem = cartItems[index] || {};
                    return {
                        name: item?.name,
                        hostname: cartItem.hostname,
                        os: cartItem.os,
                        duration_months: cartItem.duration_months,
                        cpu: item?.vcpu,
                        ram: item?.ram_gb,
                        storage: item?.storage_gb,
                        storage_type: item?.storage_type,
                        network_speed: item?.bandwidth_mbps,
                        price: cartItem.unit_price,
                        total_price: cartItem.total_price,
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

    const checkRenewalCanRepay = async (orderId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/payments/order/${orderId}/renewal-can-repay`, {
                method: 'GET',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Check renewal repay status failed',
                    error: {
                        code: 'CHECK_RENEWAL_REPAY_FAILED',
                        detail: result.detail,
                    },
                };
            }

            return {
                message: 'Check renewal repay status successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Check renewal repay status failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CHECK_RENEWAL_REPAY_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while checking renewal repay status',
                },
            };
        }
    };

    const repayRenewalOrder = async (
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
                ? `${process.env.NEXT_PUBLIC_API_URL}/payments/vnpay/renewals/repay`
                : `${process.env.NEXT_PUBLIC_API_URL}/payments/momo/renewals/repay`;

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
                    message: 'Repay renewal order failed',
                    error: {
                        code: 'REPAY_RENEWAL_ORDER_FAILED',
                        detail: result.detail,
                    },
                };
            }

            if (result?.success && result?.payment_url) {
                redirectToPayment(result.payment_url, openInNewTab);
            }

            return {
                message: 'Repay renewal order successful',
                data: result as PaymentResponse,
            };
        } catch (error) {
            return {
                message: 'Repay renewal order failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'REPAY_RENEWAL_ORDER_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while repaying renewal order',
                },
            };
        }
    };

    const renewVps = async (
        vpsId: string,
        durationMonths: number,
        amount: number,
        phone: string,
        address: string,
        returnUrl?: string,
        method: 'vnpay' | 'momo' = 'vnpay',
        openInNewTab: boolean = false
    ): Promise<ApiResponse> => {
        try {
            const endpoint = method === 'vnpay'
                ? `${process.env.NEXT_PUBLIC_API_URL}/payments/vnpay/renewals`
                : `${process.env.NEXT_PUBLIC_API_URL}/payments/momo/renewals`;

            const response = await apiPattern(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    vps_id: vpsId,
                    duration_months: durationMonths,
                    amount,
                    phone,
                    address,
                    return_url: returnUrl,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Renewal payment failed',
                    error: {
                        code: 'RENEWAL_PAYMENT_FAILED',
                        detail: result.detail,
                    },
                };
            }

            if (result?.success && result?.payment_url) {
                redirectToPayment(result.payment_url, openInNewTab);
            }

            return {
                message: 'Renewal payment created successfully',
                data: result as PaymentResponse,
            };
        } catch (error) {
            return {
                message: 'Renewal payment failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'RENEWAL_PAYMENT_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while creating renewal payment',
                },
            };
        }
    };

    const verifyRenewalPayment = async (method: 'momo' | 'vnpay', query: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${method}/renewals/return?${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Renewal payment verification failed',
                    error: {
                        code: 'RENEWAL_VERIFICATION_ERROR',
                        detail: result.detail,
                    },
                };
            }

            return {
                message: 'Renewal payment verified successfully',
                data: result,
            };
        } catch {
            return {
                message: 'Renewal payment verification failed',
                error: {
                    code: 'RENEWAL_VERIFICATION_ERROR',
                    detail: 'An unexpected error occurred while verifying renewal payment',
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
        redirectToPayment,
        checkCanRepay,
        repayOrder,
        checkRenewalCanRepay,
        repayRenewalOrder,
        renewVps,
        verifyRenewalPayment,
    };
}

export default usePayment;
