import { sendPasswordResetEmail, sendVerificationMail } from "@/lib/email/resend";
import { useTranslations } from "next-intl";
import { ApiResponse, Login, Register } from "@/types/types";

const baseURL = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000';

const useAuth = () => {
    const commonT = useTranslations("errors.common")
    const apiT = useTranslations("api")

    const login = async ({
        email,
        password,
    }: Login): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Enable cookies
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Login failed",
                    error: {
                        code: "LOGIN_ERROR",
                        detail: result.detail
                    }
                }
            }

            if (result.data && result.data.email_verified === false) {
                await sendVerificationMail(
                    result.data.email,
                    `${baseURL}/verify-email?token=${result.data.verification_token}`,
                    result.data.name
                )

                return {
                    message: result.message,
                    data: {
                        email_verified: false,
                        email: result.data.email,
                        name: result.data.name,
                        verification_token: result.data.verification_token,
                    }
                }
            }

            // Email is verified, return login data
            return {
                message: result.message,
                data: {
                    email_verified: true,
                    access_token: result.data.access_token,
                    token_type: result.data.token_type,
                }
            }
        } catch {
            return {
                message: "Login failed",
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
    }: Register): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
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

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Registration failed",
                    error: {
                        code: 'REGISTRATION_ERROR',
                        detail: result.detail
                    },
                }
            }

            await sendVerificationMail(
                email,
                `${baseURL}/verify-email?token=${result.data.verification_token}`,
                name
            )

            return {
                message: result.message,
                data: result.data || {}
            }
        } catch {
            return {
                message: "Registration failed",
                error: {
                    code: "REGISTRATION_ERROR",
                    detail: "An unexpected error occurred during registration"
                }
            }
        }
    }

    const resendVerificationMail = async (email: string, name: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Resend verification email failed",
                    error: {
                        code: 'RESEND_VERIFICATION_ERROR',
                        detail: result.detail
                    }
                }
            }

            await sendVerificationMail(
                email,
                `${baseURL}/verify-email?token=${result.data.verification_token}`,
                name
            )

            return {
                message: result.message,
                data: result.data || {}
            }
        } catch {
            return {
                message: "Resend verification email failed",
                error: {
                    code: "RESEND_VERIFICATION_ERROR",
                    detail: "An unexpected error occurred during resending verification email"
                }
            }
        }
    }

    const verifyEmail = async (token: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Email verification failed",
                    error: {
                        code: result.detail?.code || "EMAIL_VERIFICATION_ERROR",
                        detail: result.detail?.message || "Email verification failed"
                    }
                }
            }

            return {
                message: result.message,
                data: result.data || {}
            }
        } catch {
            return {
                message: "Email verification failed",
                error: {
                    code: "SERVER_ERROR",
                    detail: "An unexpected error occurred during email verification"
                }
            }
        }
    }

    const resendResetPasswordEmail = async (email: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Resend reset password email failed",
                    error: {
                        code: 'RESEND_RESET_PASSWORD_ERROR',
                        detail: result.detail
                    }
                }
            }

            await sendPasswordResetEmail(
                email,
                `${baseURL}/reset-password?token=${result.data.reset_token}&email=${encodeURIComponent(email)}`,
                result.data.name
            )

            return {
                message: result.message,
                data: result.data || {}
            }
        } catch {
            return {
                message: "Resend reset password email failed",
                error: {
                    code: "RESEND_RESET_PASSWORD_ERROR",
                    detail: "An unexpected error occurred during resending reset password email"
                }
            }
        }
    }

    const forgotPassword = async (email: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Sending password reset email failed",
                    error: {
                        code: 'FORGOT_PASSWORD_ERROR',
                        detail: result.detail
                    }
                }
            }

            await sendPasswordResetEmail(
                email,
                `${baseURL}/reset-password?token=${result.data.reset_token}&email=${encodeURIComponent(email)}`,
                result.data.name
            )

            return {
                message: result.message,
                data: result.data || {}
            }
        } catch {
            return {
                message: "Sending password reset email failed",
                error: {
                    code: "FORGOT_PASSWORD_ERROR",
                    detail: "An unexpected error occurred while sending reset password email"
                }
            }
        }
    }

    const resetPassword = async (token: string, email: string, password: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    email,
                    password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Failed to reset password",
                    error: {
                        code: 'RESET_PASSWORD_ERROR',
                        detail: result.detail
                    }
                }
            }

            return {
                message: result.message,
                data: result.data || {}
            }
        } catch {
            return {
                message: "Failed to reset password",
                error: {
                    code: "RESET_PASSWORD_ERROR",
                    detail: "An unexpected error occurred while resetting password"
                }
            }
        }
    }

    const validateResetToken = async (token: string, email: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-reset-token?token=${token}&email=${encodeURIComponent(email)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Invalid token',
                    error: {
                        code: 'VALIDATE_TOKEN_ERROR',
                        detail: result.detail
                    }
                }
            }

            return {
                message: result.message,
                data: {
                    user: result.data?.user,
                    tokenExpiry: result.data?.token_expiry
                }
            }
        } catch {
            return {
                message: "Failed to validate token",
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
        resendVerificationMail,
        verifyEmail,
        resendResetPasswordEmail,
        forgotPassword,
        resetPassword,
        validateResetToken
    }
}

export default useAuth