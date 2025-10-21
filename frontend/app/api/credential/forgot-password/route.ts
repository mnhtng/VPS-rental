import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/resend';

// Validation schema for forgot password request
const forgotPasswordSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const { email } = forgotPasswordSchema.parse(body);

        // Find user by email
        const user = await db.user.findUnique({
            where: { email }
        });

        // Always return success message for security (don't reveal if email exists)
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.',
            }, { status: 200 });
        }

        // Check if user email is verified
        if (!user.emailVerified) {
            return NextResponse.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.',
            }, { status: 200 });
        }

        // Generate reset token
        const resetToken = uuidv4();

        // Delete any existing reset tokens for this user
        await db.verificationToken.deleteMany({
            where: {
                identifier: email,
            }
        });

        // Create new reset token (expires in 1 hour)
        await db.verificationToken.create({
            data: {
                identifier: email,
                token: resetToken,
                expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            }
        });

        // Generate reset URL
        const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send password reset email
        try {
            await sendPasswordResetEmail(email, resetUrl, user.name || 'Khách hàng');
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);

            // Clean up the reset token if email fails
            await db.verificationToken.deleteMany({
                where: {
                    identifier: email,
                    token: resetToken,
                }
            });

            return NextResponse.json(
                { error: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam).',
        }, { status: 200 });

    } catch (error) {
        console.error('Forgot password error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Email không hợp lệ',
                    details: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại sau.' },
            { status: 500 }
        );
    }
}

// Optional: GET method to check if reset token is valid
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            return NextResponse.json(
                { error: 'Token và email là bắt buộc' },
                { status: 400 }
            );
        }

        // Find valid reset token
        const resetToken = await db.verificationToken.findFirst({
            where: {
                token,
                identifier: email,
                expires: {
                    gt: new Date(), // Token hasn't expired
                },
            },
        });

        if (!resetToken) {
            return NextResponse.json(
                {
                    error: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
                    code: 'INVALID_TOKEN'
                },
                { status: 400 }
            );
        }

        // Find the user
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Người dùng không tồn tại' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Token hợp lệ',
            user: {
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Check reset token error:', error);
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi trong quá trình kiểm tra token' },
            { status: 500 }
        );
    }
}