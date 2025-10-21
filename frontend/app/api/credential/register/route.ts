import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationMail } from '@/lib/email/resend';
import { registerSchema } from '@/lib/schema';
import { ApiResponse } from '@/types/types';
import { createUser, createVerifyToken, deleteUser, deleteVerifyToken, isUserExists } from '@/services/authService';
import { hashPassword } from '@/utils/hash';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { success, data, error } = registerSchema.safeParse(body);
        if (!success) {
            const response: ApiResponse<null> = {
                success: false,
                message: 'Invalid input data',
                data: null,
                error: {
                    code: error.issues[0]?.code.toUpperCase() || 'INVALID_TYPE',
                    detail: error.issues[0]?.message,
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    requestID: uuidv4()
                }
            };

            return NextResponse.json(response, { status: 400 });
        }

        const { name, email, password, phone } = data;

        const existingUser = await isUserExists(email);

        if (existingUser) {
            const response: ApiResponse<null> = {
                success: false,
                message: 'Email is already registered',
                data: null,
                error: {
                    code: 'EMAIL_EXISTS',
                    detail: 'A user with this email already exists. Please use a different email.',
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    requestID: uuidv4()
                }
            };

            return NextResponse.json(response, { status: 400 });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);
        // Generate verification token
        const verificationToken = uuidv4();

        const user = await createUser({
            name,
            email,
            password: hashedPassword,
            phone
        });

        const verificationRecord = await createVerifyToken({
            identifier: email,
            token: verificationToken,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        })

        // Generate verification URL
        const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        // Send verification email
        try {
            await sendVerificationMail(
                email,
                verificationUrl,
                name,
            );
        } catch {
            // If email fails to send, we should clean up the user and token
            await deleteUser({ id: user.id });
            await deleteVerifyToken({ id: verificationRecord.id });

            const response: ApiResponse<null> = {
                success: false,
                message: 'Could not send verification email',
                data: null,
                error: {
                    code: 'EMAIL_SEND_FAILURE',
                    detail: 'Failed to send verification email. Please try again later.',
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    requestID: uuidv4()
                }
            };

            return NextResponse.json(response, { status: 500 });
        }

        const response: ApiResponse<{
            email: string;
            name: string;
            verificationSent: boolean;
        }> = {
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                email: user.email,
                name: user.name,
                verificationSent: true
            },
            error: null,
            meta: {
                timestamp: new Date().toISOString(),
                path: request.url,
                requestID: uuidv4()
            }
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const response: ApiResponse<null> = {
                success: false,
                message: 'Invalid input data',
                data: null,
                error: {
                    code: error.issues[0]?.code.toUpperCase() || 'INVALID_TYPE',
                    detail: error.issues[0]?.message,
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    requestID: uuidv4()
                }
            };

            return NextResponse.json(response, { status: 400 });
        }

        const response: ApiResponse<null> = {
            success: false,
            message: 'Internal server error',
            data: null,
            error: {
                code: 'REGISTRATION_ERROR',
                detail: 'An error occurred during registration. Please try again later.',
                // detail: (error instanceof Error) ? error.message : 'An unexpected error occurred during registration',
            },
            meta: {
                timestamp: new Date().toISOString(),
                path: request.url,
                requestID: uuidv4()
            }
        };

        return NextResponse.json(response, { status: 500 });
    }
}
