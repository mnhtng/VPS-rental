import { apiPattern } from "@/utils/pattern"
import { Promotion, ValidatePromotionResponse } from "@/types/types"

const usePromotion = () => {
    const getAvailablePromotions = async () => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/promotions/available`, {
                method: 'GET',
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Failed to fetch available promotions",
                    error: {
                        code: "GET_PROMOTIONS_FAILED",
                        details: result.detail,
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
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
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
    }) => {
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
                        details: result.detail,
                    }
                }
            }

            return {
                data: result as ValidatePromotionResponse,
            }
        } catch (error) {
            return {
                message: "Promotion validation failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VALIDATE_PROMOTION_FAILED',
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while validating promotion",
                }
            }
        }
    }

    const getPromotionHistory = async () => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/promotions/history`, {
                method: 'GET',
            })

            const result = await response.json()

            if (!response.ok) {
                return {
                    message: "Failed to fetch promotion history",
                    error: {
                        code: "GET_PROMOTION_HISTORY_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to fetch promotion history",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_PROMOTION_HISTORY_FAILED',
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while fetching promotion history",
                }
            }
        }
    }

    return {
        getAvailablePromotions,
        validatePromotion,
        getPromotionHistory,
    }
}

export default usePromotion
