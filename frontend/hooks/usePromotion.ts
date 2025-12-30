import { apiPattern } from "@/utils/pattern"
import { ApiResponse, Promotion, ValidatePromotion } from "@/types/types"

const usePromotion = () => {
    const getAvailablePromotions = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/promotions/available`, {
                method: 'GET',
                signal,
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Failed to fetch available promotions",
                    error: {
                        code: "GET_PROMOTIONS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as Promotion[] || [],
            }
        } catch (error) {
            return {
                message: "Failed to fetch available promotions",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_PROMOTIONS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while fetching promotions",
                }
            }
        }
    }

    const validatePromotion = async ({
        code,
        cartTotalAmount,
    }: {
        code: string,
        cartTotalAmount: number,
    }): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/promotions/validate`, {
                method: 'POST',
                body: JSON.stringify({
                    code: code.toUpperCase(),
                    cart_total_amount: cartTotalAmount,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Promotion validation failed",
                    error: {
                        code: "VALIDATE_PROMOTION_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as ValidatePromotion,
            }
        } catch (error) {
            return {
                message: "Promotion validation failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VALIDATE_PROMOTION_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while validating promotion",
                }
            }
        }
    }

    const getPromotionHistory = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/promotions/history`, {
                method: 'GET',
                signal,
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Failed to fetch promotion history",
                    error: {
                        code: "GET_PROMOTION_HISTORY_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as Promotion[] || [],
            }
        } catch (error) {
            return {
                message: "Failed to fetch promotion history",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_PROMOTION_HISTORY_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while fetching promotion history",
                }
            }
        }
    }

    const getPromotionCart = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/promotions/cart`, {
                method: 'GET',
                signal,
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Failed to fetch promotion in cart",
                    error: {
                        code: "GET_PROMOTION_CART_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "Promotion in cart fetched successfully",
                data: result as ValidatePromotion | null,
            }
        } catch (error) {
            return {
                message: "Failed to fetch promotion in cart",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_PROMOTION_CART_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while fetching promotion in cart",
                }
            }
        }
    }

    return {
        getAvailablePromotions,
        validatePromotion,
        getPromotionHistory,
        getPromotionCart,
    }
}

export default usePromotion
