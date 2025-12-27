import { apiPattern } from "@/utils/pattern";
import { ApiResponse, VPSInstance, VPSInfo } from "@/types/types";
import { sendVPSWelcomeEmail } from "@/lib/email/resend";

const useVPS = () => {
    const getMyVps = async (limit: number | null = null, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/my-vps${limit !== null ? `?limit=${limit}` : ''}`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get VPS list failed',
                    error: {
                        code: 'VPS_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Get VPS list successful',
                data: result as VPSInstance[] | [],
            };
        } catch (error) {
            return {
                message: 'Get VPS list failed',
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
            // No timeout limit as VM provisioning can take a long time
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/setup`, {
                method: 'POST',
                body: JSON.stringify({
                    order_number: orderNumber,
                }),
                timeout: 0,
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

            for (const vps of result.vps_list || []) {
                try {
                    await sendVPSWelcomeEmail({
                        customerName: result.customer_name,
                        customerEmail: result.customer_email,
                        orderNumber: result.order_number,
                        orderDate: new Date(result.order_date).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        }),
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
                            subIpAddress: vps.credentials.sub_ip_addresses,
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
            // Check for timeout/abort errors
            const isTimeout = error instanceof Error && (
                error.name === 'AbortError' ||
                error.message.includes('aborted') ||
                error.message.includes('timeout')
            );

            return {
                message: 'VPS setup failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : isTimeout
                            ? 'VPS_SETUP_TIMEOUT'
                            : 'VPS_SETUP_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : isTimeout
                            ? 'VPS setup is taking longer than expected. Please check your VPS list in a few minutes.'
                            : 'An unexpected error occurred while setting up VPS',
                }
            };
        }
    };

    const getVpsInfo = async (vpsId: string, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/info`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get VPS info failed',
                    error: {
                        code: 'VPS_INFO_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Get VPS info successful',
                data: result as VPSInfo,
            };
        } catch (error) {
            return {
                message: 'Get VPS info failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_INFO_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching VPS info',
                }
            };
        }
    };

    const getRRD = async (
        vpsId: string,
        timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year',
        cf?: 'AVERAGE' | 'MAX',
        signal?: AbortSignal
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/rrd${timeframe || cf ? '?' : ''}${timeframe ? `timeframe=${timeframe}` : ''}${timeframe && cf ? '&' : ''}${cf ? `cf=${cf}` : ''}`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get VPS RRD data failed',
                    error: {
                        code: 'VPS_RRD_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Get VPS RRD data successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Get VPS RRD data failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VPS_RRD_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching VPS RRD data',
                }
            };
        }
    };

    const startVM = async (vpsId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/power`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'start'
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Start VM failed',
                    error: {
                        code: 'VM_START_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Start VM successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Start VM failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VM_START_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while starting VM',
                }
            };
        }
    };

    const stopVM = async (vpsId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/power`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'stop'
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Stop VM failed',
                    error: {
                        code: 'VM_STOP_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Stop VM successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Stop VM failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VM_STOP_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while stopping VM',
                }
            };
        }
    };

    const rebootVM = async (vpsId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/power`, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'reboot'
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Reboot VM failed',
                    error: {
                        code: 'VM_REBOOT_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Reboot VM successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Reboot VM failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'VM_REBOOT_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while rebooting VM',
                }
            };
        }
    };

    const listSnapshots = async (vpsId: string, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/snapshots`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'List snapshots failed',
                    error: {
                        code: 'SNAPSHOT_LIST_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'List snapshots successful',
                data: result,
            };
        } catch (error) {
            return {
                message: 'List snapshots failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'SNAPSHOT_LIST_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while listing snapshots',
                }
            };
        }
    };

    const createSnapshot = async (vpsId: string, name: string, description?: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/snapshots`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description: description || '',
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Create snapshot failed',
                    error: {
                        code: 'SNAPSHOT_CREATE_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Snapshot creation initiated',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Create snapshot failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'SNAPSHOT_CREATE_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while creating snapshot',
                }
            };
        }
    };

    const restoreSnapshot = async (vpsId: string, snapshotName: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/snapshots/restore`, {
                method: 'POST',
                body: JSON.stringify({
                    snapshot_name: snapshotName,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Restore snapshot failed',
                    error: {
                        code: 'SNAPSHOT_RESTORE_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Snapshot restore initiated',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Restore snapshot failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'SNAPSHOT_RESTORE_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while restoring snapshot',
                }
            };
        }
    };

    const deleteSnapshot = async (vpsId: string, snapshotName: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/snapshots/${encodeURIComponent(snapshotName)}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Delete snapshot failed',
                    error: {
                        code: 'SNAPSHOT_DELETE_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Snapshot deletion initiated',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Delete snapshot failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'SNAPSHOT_DELETE_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while deleting snapshot',
                }
            };
        }
    };

    return {
        getMyVps,
        setupVps,
        getVpsInfo,
        getRRD,
        startVM,
        stopVM,
        rebootVM,
        listSnapshots,
        createSnapshot,
        restoreSnapshot,
        deleteSnapshot,
    }
}

export default useVPS
