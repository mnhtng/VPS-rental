import { apiPattern } from "@/utils/pattern";
import { ApiResponse } from "@/types/types";
import { sendVPSWelcomeEmail } from "@/lib/email/resend";

export interface VPSInstance {
    id: string;
    status: string;
    expires_at: string;
    auto_renew: boolean;
    created_at: string;
    plan_name?: string;
    vmid?: number;
    hostname?: string;
    ip_address?: string;
    vcpu?: number;
    ram_gb?: number;
    storage_gb?: number;
    storage_type?: string;
    bandwidth_mbps?: number;
    power_status?: string;
}

const useVPS = () => {
    const getMyVps = async (): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/my-vps`, {
                method: 'GET',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Failed to fetch VPS list',
                    error: {
                        code: 'VPS_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'VPS list fetched successfully',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Failed to fetch VPS list',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching VPS list',
                }
            };
        }
    };

    const setupVps = async (orderNumber: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/setup`, {
                method: 'POST',
                body: JSON.stringify({
                    order_number: orderNumber,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'VPS setup failed',
                    error: {
                        code: 'VPS_SETUP_ERROR',
                        detail: result.detail,
                    }
                };
            }

            // Send VPS welcome email for each provisioned VPS
            for (const vps of result.vps_list || []) {
                try {
                    await sendVPSWelcomeEmail({
                        customerName: result.customer_name,
                        customerEmail: result.customer_email,
                        orderNumber: result.order_number,
                        orderDate: result.order_date,
                        vps: {
                            name: vps.vps_info.name,
                            hostname: vps.hostname,
                            os: vps.vps_info.os,
                            cpu: vps.vps_info.cpu,
                            ram: vps.vps_info.ram,
                            storage: vps.vps_info.storage,
                            storage_type: vps.vps_info.storage_type,
                            network_speed: vps.vps_info.network_speed,
                        },
                        credentials: {
                            ipAddress: vps.credentials.ip_address,
                            username: vps.credentials.username,
                            password: vps.credentials.password,
                            sshPort: vps.credentials.ssh_port,
                        },
                    });
                } catch {
                    return {
                        message: 'VPS setup succeeded but failed to send welcome email',
                        error: {
                            code: 'WELCOME_EMAIL_ERROR',
                            detail: 'Failed to send VPS welcome email',
                        }
                    };
                }
            }

            return {
                message: result.message || 'VPS setup successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'VPS setup failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_SETUP_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while setting up VPS',
                }
            };
        }
    };

    return {
        getMyVps,
        setupVps,
    }
}

export default useVPS
