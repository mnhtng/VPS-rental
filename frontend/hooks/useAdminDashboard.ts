import { apiPattern } from "@/utils/pattern";
import { ApiResponse, DashboardStats, AnalyticsStats } from "@/types/types";

const useAdminDashboard = () => {
    const getDashboardStats = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get dashboard statistics",
                    error: {
                        code: "GET_DASHBOARD_STATS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as DashboardStats,
            }
        } catch (error) {
            return {
                message: "Failed to get dashboard statistics",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_DASHBOARD_STATS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching dashboard statistics",
                }
            }
        }
    }

    const getAnalyticsStats = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/analytics`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get analytics statistics",
                    error: {
                        code: "GET_ANALYTICS_STATS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as AnalyticsStats,
            }
        } catch (error) {
            return {
                message: "Failed to get analytics statistics",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_ANALYTICS_STATS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching analytics statistics",
                }
            }
        }
    }

    return {
        getDashboardStats,
        getAnalyticsStats,
    }
}

export default useAdminDashboard;
