import { apiPattern } from '@/utils/pattern';
import { PasswordChange, Profile, ProfileUpdate, User } from '@/types/types';

const useMember = () => {
    const getProfile = async () => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'GET',
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Get profile failed",
                    error: {
                        code: "GET_PROFILE_FAILED",
                        details: result.detail,
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
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while fetching the profile",
                }
            }
        }
    }

    const updateProfile = async (data: ProfileUpdate) => {
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
                        details: result.detail,
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
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while updating the profile",
                }
            }
        }
    }

    const changePassword = async (data: PasswordChange) => {
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
                        details: result.detail,
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
                    details: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while changing password",
                }
            }
        }
    }

    return {
        getProfile,
        updateProfile,
        changePassword,
    }
}

export default useMember;