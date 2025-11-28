import { useAuth } from '@/contexts/AuthContext';
import { VPSPlan } from '@/types/types';

const useProduct = () => {
    const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_NAME || 'pcloud_access_token';
    const { refreshAccessToken } = useAuth();

    const getPlans = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Get plans failed",
                    error: {
                        code: "GET_PLANS_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result,
            }
        } catch {
            return {
                message: "Get plans failed",
                error: {
                    code: "GET_PLANS_FAILED",
                    details: "An unexpected error occurred while fetching plans",
                }
            }
        }
    }

    const getPlanItem = async (planId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${planId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Get plan failed",
                    error: {
                        code: "GET_PLAN_FAILED",
                        details: result.detail,
                    }
                }
            }
            return {
                data: result,
            }
        } catch {
            return {
                message: "Get plan failed",
                error: {
                    code: "GET_PLAN_FAILED",
                    details: "An unexpected error occurred while fetching the plan",
                }
            }
        }
    }

    const addToCart = async ({
        planID,
        hostname,
        osType,
        osVersion,
        durationMonths,
        totalPrice,
    }: {
        planID: string,
        hostname: string,
        osType: string,
        osVersion: string,
        durationMonths: number,
        totalPrice: number,
    }) => {
        try {
            let currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);

            if (!currentToken) {
                const refreshed = await refreshAccessToken();

                if (!refreshed) {
                    return {
                        message: "Add to cart failed",
                        error: {
                            code: "NO_ACCESS_TOKEN",
                            details: "No access token available",
                        }
                    }
                }

                currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    plan_id: planID,
                    hostname,
                    os_type: osType,
                    os_version: osVersion,
                    duration_months: durationMonths,
                    total_price: totalPrice,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    const refreshed = await refreshAccessToken();

                    if (refreshed) {
                        return await addToCart({
                            planID,
                            hostname,
                            osType,
                            osVersion,
                            durationMonths,
                            totalPrice,
                        });
                    }
                }

                return {
                    message: "Add to cart failed",
                    error: {
                        code: "ADD_TO_CART_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result,
            }
        } catch {
            return {
                message: "Add to cart failed",
                error: {
                    code: "ADD_TO_CART_FAILED",
                    details: "An unexpected error occurred while adding to cart",
                }
            }
        }
    }

    return {
        getPlans,
        getPlanItem,
        addToCart,
    }
}

export default useProduct
