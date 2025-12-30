import { apiPattern } from "@/utils/pattern"

interface VNCInfo {
    success: boolean;
    task: {
        port: number;
        ticket: string;
        cert?: string;
    };
    host: string;
    message: string;
}

interface VMStatus {
    status: string;
    cpu: number;
    mem: number;
    maxmem: number;
    disk: number;
    maxdisk: number;
    uptime: number;
    netin: number;
    netout: number;
}

interface VMConfig {
    cores: number;
    memory: number;
    name: string;
    ostype: string;
    [key: string]: unknown;
}

const useProxmox = () => {
    const getVNCInfo = async (vmId: number) => {
        try {
            const response = await apiPattern(
                `${process.env.NEXT_PUBLIC_API_URL}/proxmox/vms/${vmId}/vnc`,
                {
                    method: 'GET',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get VNC info",
                    error: {
                        code: "VNC_INFO_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result as VNCInfo,
            }
        } catch (error) {
            return {
                message: "Failed to get VNC info",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : 'VNC_INFO_FAILED',
                    details: error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
                }
            }
        }
    };

    /**
     * Get VM live status
     */
    const getVMStatus = async (vmId: number) => {
        try {
            const response = await apiPattern(
                `${process.env.NEXT_PUBLIC_API_URL}/proxmox/vms/${vmId}/status`,
                {
                    method: 'GET',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get VM status",
                    error: {
                        code: "VM_STATUS_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result as VMStatus,
            }
        } catch (error) {
            return {
                message: "Failed to get VM status",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : 'VM_STATUS_FAILED',
                    details: error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
                }
            }
        }
    };

    /**
     * Get VM configuration
     */
    const getVMConfig = async (vmId: number) => {
        try {
            const response = await apiPattern(
                `${process.env.NEXT_PUBLIC_API_URL}/proxmox/vms/${vmId}/config`,
                {
                    method: 'GET',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get VM config",
                    error: {
                        code: "VM_CONFIG_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result as VMConfig,
            }
        } catch (error) {
            return {
                message: "Failed to get VM config",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : 'VM_CONFIG_FAILED',
                    details: error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
                }
            }
        }
    };

    const startVM = async (vmId: number) => {
        try {
            const response = await apiPattern(
                `${process.env.NEXT_PUBLIC_API_URL}/proxmox/vms/${vmId}/start`,
                {
                    method: 'POST',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to start VM",
                    error: {
                        code: "VM_START_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to start VM",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : 'VM_START_FAILED',
                    details: error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
                }
            }
        }
    };

    /**
     * Stop VM
     */
    const stopVM = async (vmId: number) => {
        try {
            const response = await apiPattern(
                `${process.env.NEXT_PUBLIC_API_URL}/proxmox/vms/${vmId}/stop`,
                {
                    method: 'POST',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to stop VM",
                    error: {
                        code: "VM_STOP_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to stop VM",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : 'VM_STOP_FAILED',
                    details: error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
                }
            }
        }
    };

    /**
     * Reboot VM
     */
    const rebootVM = async (vmId: number) => {
        try {
            const response = await apiPattern(
                `${process.env.NEXT_PUBLIC_API_URL}/proxmox/vms/${vmId}/reboot`,
                {
                    method: 'POST',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to reboot VM",
                    error: {
                        code: "VM_REBOOT_FAILED",
                        details: result.detail,
                    }
                }
            }

            return {
                data: result,
            }
        } catch (error) {
            return {
                message: "Failed to reboot VM",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'NO_ACCESS_TOKEN'
                        : 'VM_REBOOT_FAILED',
                    details: error instanceof Error
                        ? error.message
                        : "An unexpected error occurred",
                }
            }
        }
    };

    return {
        getVNCInfo,
        getVMStatus,
        getVMConfig,
        startVM,
        stopVM,
        rebootVM,
    };
};

export default useProxmox;
