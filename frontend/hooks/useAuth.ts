import { useTranslations } from "next-intl";

interface LoginProps {
    email: string;
    password: string;
}

interface RegisterProps {
    name: string;
    email: string;
    password: string;
    phone: string | null;
}

const useAuth = () => {
    const commonT = useTranslations("errors.common")
    const apiT = useTranslations("api")

    const login = async ({
        email,
        password,
    }: LoginProps) => {
        try {
            const response = await fetch('/api/credential/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    message: data.message,
                    error: data.error
                }
            }

            return {
                message: data.message,
                data: data.data || {}
            }
        } catch {
            return {
                message: "Login failed!",
                error: {
                    code: "LOGIN_ERROR",
                    detail: "An unexpected error occurred during login"
                }
            }
        }
    }

    const register = async ({
        name,
        email,
        password,
        phone
    }: RegisterProps) => {
        try {
            const response = await fetch('/api/credential/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    phone
                }),
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    message: data.message,
                    error: data.error
                }
            }

            return {
                message: data.message,
                data: data.data || {}
            }
        } catch {
            return {
                message: "Failed to register!",
                error: {
                    code: "REGISTRATION_ERROR",
                    detail: "An unexpected error occurred during registration"
                }
            }
        }
    }

    const verifyEmail = async (token: string, email: string) => {
        try {
            const response = await fetch('/api/credential/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, email }),
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    message: data.message,
                    error: data.error
                }
            }

            return {
                message: data.message,
                data: data.data || {}
            }
        } catch {
            return {
                message: "Email verification failed!",
                error: {
                    code: "VERIFICATION_ERROR",
                    detail: "An unexpected error occurred during email verification"
                }
            }
        }
    }

    const forgotPassword = async (email: string) => {
        try {
            const response = await fetch('/api/credential/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    message: data.error || 'Đã xảy ra lỗi khi gửi email đặt lại mật khẩu',
                    error: data.error
                }
            }

            return {
                success: true,
                message: data.message,
                data: data.data
            }
        } catch {
            return {
                message: "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.",
                error: {
                    code: "FORGOT_PASSWORD_ERROR",
                    detail: "An unexpected error occurred while sending reset password email"
                }
            }
        }
    }

    const resetPassword = async (token: string, email: string, password: string, confirmPassword: string) => {
        try {
            const response = await fetch('/api/credential/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    email,
                    password,
                    confirmPassword
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    message: data.error || 'Đã xảy ra lỗi khi đặt lại mật khẩu',
                    error: data.error,
                    details: data.details
                }
            }

            return {
                success: true,
                message: data.message,
                user: data.user
            }
        } catch {
            return {
                message: "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.",
                error: {
                    code: "RESET_PASSWORD_ERROR",
                    detail: "An unexpected error occurred while resetting password"
                }
            }
        }
    }

    const validateResetToken = async (token: string, email: string) => {
        try {
            const response = await fetch(`/api/credential/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (!response.ok) {
                return {
                    message: data.error || 'Token không hợp lệ',
                    error: data.error,
                    code: data.code
                }
            }

            return {
                success: true,
                message: data.message,
                user: data.user,
                tokenExpiry: data.tokenExpiry
            }
        } catch {
            return {
                message: "Không thể xác thực token. Vui lòng thử lại sau.",
                error: {
                    code: "VALIDATE_TOKEN_ERROR",
                    detail: "An unexpected error occurred while validating reset token"
                }
            }
        }
    }

    return {
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        validateResetToken
    }
}

export default useAuth