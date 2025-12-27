import { apiPattern } from "@/utils/pattern";
import { ApiResponse, AdminOrder, OrderStatistics, MonthlyRevenue } from "@/types/types";

const useAdminOrders = () => {
    const getAllOrders = async (
        skip: number = 0,
        limit?: number,
        status?: string,
        signal?: AbortSignal
    ): Promise<ApiResponse> => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/?skip=${skip}`;
            if (limit) {
                url += `&limit=${limit}`;
            }
            if (status && status !== 'all') {
                url += `&status=${status}`;
            }

            const response = await apiPattern(url, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get orders list",
                    error: {
                        code: "GET_ORDERS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as AdminOrder[] || [],
            }
        } catch (error) {
            return {
                message: "Failed to get orders list",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_ORDERS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching orders list",
                }
            }
        }
    }

    const getOrderStatistics = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/statistics`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get order statistics",
                    error: {
                        code: "GET_ORDER_STATS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as OrderStatistics,
            }
        } catch (error) {
            return {
                message: "Failed to get order statistics",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_ORDER_STATS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching order statistics",
                }
            }
        }
    }

    const getMonthlyRevenue = async (year?: number, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/revenue/monthly`;
            if (year) {
                url += `?year=${year}`;
            }

            const response = await apiPattern(url, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get monthly revenue",
                    error: {
                        code: "GET_MONTHLY_REVENUE_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as MonthlyRevenue[],
            }
        } catch (error) {
            return {
                message: "Failed to get monthly revenue",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_MONTHLY_REVENUE_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching monthly revenue",
                }
            }
        }
    }

    return {
        getAllOrders,
        getOrderStatistics,
        getMonthlyRevenue,
    }
}

export default useAdminOrders;
