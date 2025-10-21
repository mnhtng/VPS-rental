import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import db from '@/lib/prisma';

// Validation schema for reset password
const resetPasswordSchema = z.object({
    token: z.string().uuid('Token không hợp lệ'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const { token, email, password } = resetPasswordSchema.parse(body);

        // Find the reset token
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

        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user password
        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            }
        });

        // Delete the reset token (it's used now)
        await db.verificationToken.delete({
            where: { id: resetToken.id }
        });

        return NextResponse.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay bây giờ.',
            user: {
                email: user.email,
                name: user.name,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Reset password error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Dữ liệu không hợp lệ',
                    details: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu. Vui lòng thử lại.' },
            { status: 500 }
        );
    }
}

// GET method to validate reset token without changing password
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            return NextResponse.json(
                {
                    error: 'Token và email là bắt buộc',
                    code: 'MISSING_PARAMS'
                },
                { status: 400 }
            );
        }

        // Validate token format
        try {
            z.string().uuid().parse(token);
            z.string().email().parse(email);
        } catch {
            return NextResponse.json(
                {
                    error: 'Token hoặc email không đúng định dạng',
                    code: 'INVALID_FORMAT'
                },
                { status: 400 }
            );
        }

        // Find the reset token
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
                {
                    error: 'Người dùng không tồn tại',
                    code: 'USER_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Token hợp lệ',
            user: {
                email: user.email,
                name: user.name,
            },
            tokenExpiry: resetToken.expires,
        });

    } catch (error) {
        console.error('Validate reset token error:', error);
        return NextResponse.json(
            {
                error: 'Đã xảy ra lỗi trong quá trình xác thực token',
                code: 'SERVER_ERROR'
            },
            { status: 500 }
        );
    }
}