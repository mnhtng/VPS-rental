import { apiPattern } from "@/utils/pattern"
import { VPSPlan, CartItem, AddToCartPayload, ApiResponse } from "@/types/types"

const useProduct = () => {
    const getPlans = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans`, {
                method: 'GET',
                signal,
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
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as VPSPlan[] || [],
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    message: "Request aborted",
                    error: {
                        code: "ABORTED",
                        detail: "The request was aborted",
                    }
                }
            }

            return {
                message: "Get plans failed",
                error: {
                    code: "GET_PLANS_FAILED",
                    detail: "An unexpected error occurred while fetching plans",
                }
            }
        }
    }

    const getPlanItem = async (planId: string, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${planId}`, {
                method: 'GET',
                signal,
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
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as VPSPlan,
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    message: "Request aborted",
                    error: {
                        code: "ABORTED",
                        detail: "The request was aborted",
                    }
                }
            }

            return {
                message: "Get plan failed",
                error: {
                    code: "GET_PLAN_FAILED",
                    detail: "An unexpected error occurred while fetching the plan",
                }
            }
        }
    }

    const addToCart = async ({
        planID,
        hostname,
        os,
        templateOS,
        templateVersion,
        durationMonths,
        totalPrice,
    }: AddToCartPayload): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
                method: 'POST',
                body: JSON.stringify({
                    plan_id: planID,
                    hostname,
                    os,
                    os_type: templateOS,
                    os_version: templateVersion,
                    duration_months: durationMonths,
                    total_price: totalPrice,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Add to cart failed",
                    error: {
                        code: "ADD_TO_CART_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as CartItem,
            }
        } catch (error) {
            return {
                message: "Add to cart failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'ADD_TO_CART_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while adding to cart",
                }
            }
        }
    }

    const getCartItems = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get cart items failed",
                    error: {
                        code: "GET_CART_ITEMS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as CartItem[] || [],
            }
        } catch (error) {
            return {
                message: "Get cart items failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_CART_ITEMS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while getting cart items",
                }
            }
        }
    }

    const clearCart = async (): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
                method: 'DELETE',
            });

            if (response.status === 204) {
                return {
                    message: "Cart cleared successfully",
                    data: null,
                }
            }

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Clear cart failed",
                    error: {
                        code: "CLEAR_CART_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "Cart cleared successfully",
                data: null,
            };
        } catch (error) {
            return {
                message: "Clear cart failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CLEAR_CART_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while clearing the cart",
                }
            }
        }
    }

    const removeCartItem = async (item: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart/${item}`, {
                method: 'DELETE',
            });

            if (response.status === 204) {
                return {
                    message: "Cart item removed successfully",
                    data: null,
                };
            }

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Remove cart item failed",
                    error: {
                        code: "REMOVE_CART_ITEM_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "Cart item removed successfully",
                data: null,
            };
        } catch (error) {
            return {
                message: "Remove cart item failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'REMOVE_CART_ITEM_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while removing the cart item",
                }
            }
        }
    }

    const getCartItemsAmount = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get cart items amount failed",
                    error: {
                        code: "GET_CART_ITEMS_AMOUNT_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "Get cart items amount successfully",
                data: result as { total_items: number },
            }
        } catch (error) {
            return {
                message: "Get cart items amount failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_CART_ITEMS_AMOUNT_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while getting cart items amount",
                }
            }
        }
    }

    return {
        getPlans,
        getPlanItem,
        addToCart,
        getCartItems,
        clearCart,
        removeCartItem,
        getCartItemsAmount,
    }
}

export default useProduct