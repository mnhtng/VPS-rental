import { apiPattern } from "@/utils/pattern";
import { ApiResponse, VPSPlan, VPSPlanCreate, VPSPlanUpdate, VPSPlanStatistics } from "@/types/types";

const useAdminPlans = () => {
    const getPlans = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/plans`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get VPS plans",
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
            return {
                message: "Failed to get VPS plans",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_PLANS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching VPS plans",
                }
            }
        }
    }

    const getPlanStatistics = async (plans: VPSPlan[]): Promise<VPSPlanStatistics> => {
        const stats: VPSPlanStatistics = {
            total: plans.length,
            basic: 0,
            standard: 0,
            premium: 0,
        }

        for (const plan of plans) {
            const category = plan.category?.toLowerCase()
            if (category === 'basic') stats.basic++
            else if (category === 'standard') stats.standard++
            else if (category === 'premium') stats.premium++
        }

        return stats
    }

    const createPlan = async (data: VPSPlanCreate, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/plans`, {
                method: 'POST',
                body: JSON.stringify(data),
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to create VPS plan",
                    error: {
                        code: "CREATE_PLAN_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as VPSPlan || {},
            }
        } catch (error) {
            return {
                message: "Failed to create VPS plan",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CREATE_PLAN_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while creating VPS plan",
                }
            }
        }
    }

    const updatePlan = async (planId: string, data: VPSPlanUpdate, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/plans/${planId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to update VPS plan",
                    error: {
                        code: "UPDATE_PLAN_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as VPSPlan || {},
            }
        } catch (error) {
            return {
                message: "Failed to update VPS plan",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'UPDATE_PLAN_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while updating VPS plan",
                }
            }
        }
    }

    const deletePlan = async (planId: string, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/plans/${planId}`, {
                method: 'DELETE',
                signal,
            });

            if (!response.ok) {
                const result = await response.json();
                return {
                    message: "Failed to delete VPS plan",
                    error: {
                        code: "DELETE_PLAN_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: { success: true },
            }
        } catch (error) {
            return {
                message: "Failed to delete VPS plan",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'DELETE_PLAN_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while deleting VPS plan",
                }
            }
        }
    }

    return {
        getPlans,
        getPlanStatistics,
        createPlan,
        updatePlan,
        deletePlan,
    }
}

export default useAdminPlans;
