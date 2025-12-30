import { apiPattern } from "@/utils/pattern";
import { ApiResponse, VPSInstance, VPSStatistics } from "@/types/types";

const useAdminVPS = () => {
    const getAllVps = async (
        skip: number = 0,
        limit?: number,
        status?: string,
        signal?: AbortSignal
    ): Promise<ApiResponse> => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/vps?skip=${skip}`;
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
                    message: "Failed to get VPS list",
                    error: {
                        code: "GET_VPS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as VPSInstance[] || [],
            }
        } catch (error) {
            return {
                message: "Failed to get VPS list",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_VPS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching VPS list",
                }
            }
        }
    }

    const getVpsStatistics = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/vps/statistics`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get VPS statistics",
                    error: {
                        code: "GET_VPS_STATS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as VPSStatistics || [],
            }
        } catch (error) {
            return {
                message: "Failed to get VPS statistics",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_VPS_STATS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching VPS statistics",
                }
            }
        }
    }

    const adminStartVps = async (vpsId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/vps/${vpsId}/power`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'start'
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to start VPS",
                    error: {
                        code: "VPS_START_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "VPS started successfully",
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to start VPS",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_START_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while starting VPS",
                }
            }
        }
    }

    const adminStopVps = async (vpsId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/vps/${vpsId}/power`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'stop'
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to stop VPS",
                    error: {
                        code: "VPS_STOP_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "VPS stopped successfully",
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to stop VPS",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_STOP_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while stopping VPS",
                }
            }
        }
    }

    const adminRebootVps = async (vpsId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/admin/vps/${vpsId}/power`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'reboot'
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to reboot VPS",
                    error: {
                        code: "VPS_REBOOT_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "VPS reboot initiated",
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to reboot VPS",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_REBOOT_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while rebooting VPS",
                }
            }
        }
    }

    return {
        getAllVps,
        getVpsStatistics,
        adminStartVps,
        adminStopVps,
        adminRebootVps,
    }
}

export default useAdminVPS;
