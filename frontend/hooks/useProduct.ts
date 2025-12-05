import { apiPattern } from "@/utils/pattern"
import { VPSPlan, CartItem } from "@/types/types"

const useProduct = () => {
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
                data: result as VPSPlan[] || [],
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
                data: result as VPSPlan,
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
        os,
        templateOS,
        templateVersion,
        durationMonths,
        totalPrice,
    }: {
        planID: string,
        hostname: string,
        os: string,
        templateOS: string,
        templateVersion: string,
        durationMonths: number,
        totalPrice: number,
    }) => {
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
                        details: result.detail,
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
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while adding to cart",
                }
            }
        }
    }

    const getCartItems = async () => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
                method: 'GET',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get cart items failed",
                    error: {
                        code: "GET_CART_ITEMS_FAILED",
                        details: result.detail,
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
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while getting cart items",
                }
            }
        }
    }

    const clearCart = async () => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
                method: 'DELETE',
            });

            if (response.status === 204) {
                return;
            }

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Clear cart failed",
                    error: {
                        code: "CLEAR_CART_FAILED",
                        details: result.detail,
                    }
                }
            }

            return;
        } catch (error) {
            return {
                message: "Clear cart failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CLEAR_CART_FAILED',
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while clearing the cart",
                }
            }
        }
    }

    const removeCartItem = async (item: string) => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart/${item}`, {
                method: 'DELETE',
            });

            if (response.status === 204) {
                return;
            }

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Remove cart item failed",
                    error: {
                        code: "REMOVE_CART_ITEM_FAILED",
                        details: result.detail,
                    }
                }
            }

            return;
        } catch (error) {
            return {
                message: "Remove cart item failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'REMOVE_CART_ITEM_FAILED',
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An unexpected error occurred while removing the cart item",
                }
            }
        }
    }

    const getCartItemsAmount = async () => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`, {
                method: 'GET',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get cart items amount failed",
                    error: {
                        code: "GET_CART_ITEMS_AMOUNT_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result as { total_items: number },
            }
        } catch (error) {
            return {
                message: "Get cart items amount failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_CART_ITEMS_AMOUNT_FAILED',
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
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