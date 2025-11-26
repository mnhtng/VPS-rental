import { useAuth } from '@/contexts/AuthContext';
import { PasswordChange, ProfileUpdate } from '@/types/types';

const useMember = () => {
    const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_NAME || 'pcloud_access_token';
    const { refreshAccessToken } = useAuth();

    const getProfile = async () => {
        try {
            let currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);

            if (!currentToken) {
                const refreshed = await refreshAccessToken();

                if (!refreshed) {
                    return {
                        message: "Get profile failed",
                        error: {
                            code: "NO_ACCESS_TOKEN",
                            details: "No access token available",
                        }
                    }
                }

                currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Send refresh token cookie
            })

            const result = await response.json()

            if (!response.ok) {
                // If 401 Unauthorized, try to refresh token
                if (response.status === 401) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        // Retry
                        return getProfile();
                    }
                }

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
                },
            }
        } catch {
            return {
                message: "Get profile failed",
                error: {
                    code: "GET_PROFILE_FAILED",
                    details: "An error occurred while fetching the profile.",
                }
            }
        }
    }

    const updateProfile = async (data: ProfileUpdate) => {
        try {
            let currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);

            if (!currentToken) {
                const refreshed = await refreshAccessToken();

                if (!refreshed) {
                    return {
                        message: "Update profile failed",
                        error: {
                            code: "NO_ACCESS_TOKEN",
                            details: "No access token available",
                        }
                    }
                }

                currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        return updateProfile(data);
                    }
                }

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
                data: result,
            }
        } catch {
            return {
                message: "Update profile failed",
                error: {
                    code: "UPDATE_PROFILE_FAILED",
                    details: "An error occurred while updating the profile",
                }
            }
        }
    }

    const changePassword = async (data: PasswordChange) => {
        try {
            let currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);

            if (!currentToken) {
                const refreshed = await refreshAccessToken();

                if (!refreshed) {
                    return {
                        message: "Change password failed",
                        error: {
                            code: "NO_ACCESS_TOKEN",
                            details: "No access token available",
                        }
                    }
                }

                currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        return changePassword(data);
                    }
                }

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
                data: result.data,
            }
        } catch {
            return {
                message: "Change password failed",
                error: {
                    code: "CHANGE_PASSWORD_FAILED",
                    details: "An error occurred while changing password.",
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