import { apiPattern } from '@/utils/pattern';
import { ApiResponse, User, AdminUserCreate, AdminUserUpdate, UserStatistics } from '@/types/types';

const useUsers = () => {
    const getUsers = async (skip: number = 0, limit?: number, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/users/?skip=${skip}`;
            if (limit) {
                url += `&limit=${limit}`;
            }

            const response = await apiPattern(url, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get users",
                    error: {
                        code: "GET_USERS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as User[] || [],
            }
        } catch (error) {
            return {
                message: "Failed to get users",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_USERS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching users",
                }
            }
        }
    }

    const getUserById = async (userId: string, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get user",
                    error: {
                        code: "GET_USER_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as User || {},
            }
        } catch (error) {
            return {
                message: "Failed to get user",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_USER_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching user",
                }
            }
        }
    }

    const searchUsers = async (query: string, signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/search/?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to search users",
                    error: {
                        code: "SEARCH_USERS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result as User[] || [],
            }
        } catch (error) {
            return {
                message: "Failed to search users",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'SEARCH_USERS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while searching users",
                }
            }
        }
    }

    const getUserCount = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/count/`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get user count",
                    error: {
                        code: "GET_USER_COUNT_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                data: result.user_count as number || 0,
            }
        } catch (error) {
            return {
                message: "Failed to get user count",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_USER_COUNT_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching user count",
                }
            }
        }
    }

    const getUserStatistics = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to get user statistics",
                    error: {
                        code: "GET_USER_STATS_FAILED",
                        detail: result.detail,
                    }
                }
            }

            const users = result as User[] || [];
            const statistics: UserStatistics = {
                total: users.length || 0,
                admins: users.filter(u => u.role === 'ADMIN').length || 0,
                verified: users.filter(u => u.email_verified).length || 0,
            };

            return {
                data: statistics,
            }
        } catch (error) {
            return {
                message: "Failed to get user statistics",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'GET_USER_STATS_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching user statistics",
                }
            }
        }
    }

    const createUser = async (data: AdminUserCreate): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to create user",
                    error: {
                        code: "CREATE_USER_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "User created successfully",
                data: result as User || {},
            }
        } catch (error) {
            return {
                message: "Failed to create user",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CREATE_USER_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while creating user",
                }
            }
        }
    }

    const updateUser = async (userId: string, data: AdminUserUpdate): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to update user",
                    error: {
                        code: "UPDATE_USER_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "User updated successfully",
                data: result as User || {},
            }
        } catch (error) {
            return {
                message: "Failed to update user",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'UPDATE_USER_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while updating user",
                }
            }
        }
    }

    const deleteUser = async (userId: string): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                return {
                    message: "Failed to delete user",
                    error: {
                        code: "DELETE_USER_FAILED",
                        detail: result.detail,
                    }
                }
            }

            return {
                message: "User deleted successfully",
            }
        } catch (error) {
            return {
                message: "Failed to delete user",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'DELETE_USER_FAILED',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while deleting user",
                }
            }
        }
    }

    return {
        getUsers,
        getUserById,
        searchUsers,
        getUserCount,
        getUserStatistics,
        createUser,
        updateUser,
        deleteUser,
    }
}

export default useUsers;
