import { apiPattern } from '@/utils/pattern';
import { ApiResponse, Order, PasswordChange, Profile, ProfileUpdate, User } from '@/types/types';

const useMember = () => {
    const getProfile = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get profile failed",
                    error: {
                        code: "GET_PROFILE_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: result.message,
                data: {
                    "name": result.name,
                    "email": result.email,
                    "phone": result?.phone,
                    "address": result?.address,
                    "joinedDate": result?.created_at,
                    "avatar": result?.image,
                    "role": result?.role,
                } as Profile,
            }
        } catch (error) {
            return {
                message: "Get profile failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_PROFILE_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching the profile",
                }
            }
        }
    }

    const updateProfile = async (data: ProfileUpdate): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Update profile failed",
                    error: {
                        code: "UPDATE_PROFILE_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "Profile updated successfully",
                data: result as User,
            }
        } catch (error) {
            return {
                message: "Update profile failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'UPDATE_PROFILE_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while updating the profile",
                }
            }
        }
    }

    const changePassword = async (data: PasswordChange): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Change password failed",
                    error: {
                        code: "CHANGE_PASSWORD_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: result.message,
                data: result.data as User,
            }
        } catch (error) {
            return {
                message: "Change password failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CHANGE_PASSWORD_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while changing password",
                }
            }
        }
    }

    const getOrders = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get orders failed",
                    error: {
                        code: "GET_ORDERS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as Order[] | [],
            }
        } catch (error) {
            return {
                message: "Get orders failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_ORDERS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching the orders",
                }
            }
        }
    }

    return {
        getProfile,
        updateProfile,
        changePassword,
        getOrders,
    }
}

export default useMember;