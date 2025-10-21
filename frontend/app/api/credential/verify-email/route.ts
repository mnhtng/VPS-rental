import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';

// Validation schema for email verification
const verifyEmailSchema = z.object({
    token: z.string().uuid('Token không hợp lệ'),
    email: z.string().email('Email không hợp lệ'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const { token, email } = verifyEmailSchema.parse(body);

        // Find the verification token
        const verificationToken = await db.verificationToken.findFirst({
            where: {
                token,
                identifier: email,
                expires: {
                    gt: new Date(), // Token hasn't expired
                },
            },
        });

        if (!verificationToken) {
            return NextResponse.json(
                {
                    error: 'Token xác minh không hợp lệ hoặc đã hết hạn',
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

        if (user.emailVerified) {
            // Delete the verification token since email is already verified
            await db.verificationToken.delete({
                where: { id: verificationToken.id }
            });

            return NextResponse.json(
                {
                    message: 'Email đã được xác minh trước đó',
                    alreadyVerified: true
                },
                { status: 200 }
            );
        }

        // Update user to mark email as verified
        await db.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
            }
        });

        // Delete the verification token (it's used now)
        await db.verificationToken.delete({
            where: { id: verificationToken.id }
        });

        return NextResponse.json({
            success: true,
            message: 'Email đã được xác minh thành công! Bạn có thể đăng nhập ngay bây giờ.',
            user: {
                email: user.email,
                name: user.name,
                verifiedAt: new Date().toISOString(),
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Email verification error:', error);

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
            { error: 'Đã xảy ra lỗi trong quá trình xác minh. Vui lòng thử lại.' },
            { status: 500 }
        );
    }
}

// GET method for verifying email via URL parameters (used when user clicks link in email)
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

        // Use the same verification logic as POST
        const verificationResult = await verifyEmailInternal(token, email);

        if (verificationResult.success) {
            // Redirect to success page
            const redirectUrl = new URL('/email-verified', request.url);
            redirectUrl.searchParams.set('success', 'true');

            return NextResponse.redirect(redirectUrl);
        } else {
            // Redirect to error page with error info
            const redirectUrl = new URL('/email-verified', request.url);
            redirectUrl.searchParams.set('error', verificationResult.error || 'Xác minh thất bại');
            redirectUrl.searchParams.set('code', verificationResult.code || 'VERIFICATION_FAILED');

            return NextResponse.redirect(redirectUrl);
        }

    } catch (error) {
        console.error('GET email verification error:', error);

        const redirectUrl = new URL('/email-verified', request.url);
        redirectUrl.searchParams.set('error', 'Đã xảy ra lỗi hệ thống');
        redirectUrl.searchParams.set('code', 'SERVER_ERROR');

        return NextResponse.redirect(redirectUrl);
    }
}

// Helper function to verify email (shared between POST and GET)
async function verifyEmailInternal(token: string, email: string) {
    try {
        // Validate input
        const { token: validToken, email: validEmail } = verifyEmailSchema.parse({ token, email });

        // Find the verification token
        const verificationToken = await db.verificationToken.findFirst({
            where: {
                token: validToken,
                identifier: validEmail,
                expires: {
                    gt: new Date(),
                },
            },
        });

        if (!verificationToken) {
            return {
                success: false,
                error: 'Token xác minh không hợp lệ hoặc đã hết hạn',
                code: 'INVALID_TOKEN'
            };
        }

        // Find the user
        const user = await db.user.findUnique({
            where: { email: validEmail }
        });

        if (!user) {
            return {
                success: false,
                error: 'Người dùng không tồn tại',
                code: 'USER_NOT_FOUND'
            };
        }

        if (user.emailVerified) {
            // Delete the verification token
            await db.verificationToken.delete({
                where: { id: verificationToken.id }
            });

            return {
                success: true,
                message: 'Email đã được xác minh trước đó',
                alreadyVerified: true
            };
        }

        // Update user to mark email as verified
        await db.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
            }
        });

        // Delete the verification token
        await db.verificationToken.delete({
            where: { id: verificationToken.id }
        });

        return {
            success: true,
            message: 'Email đã được xác minh thành công!',
            user: {
                email: user.email,
                name: user.name,
                verifiedAt: new Date().toISOString(),
            }
        };

    } catch (error) {
        console.error('Internal verification error:', error);
        return {
            success: false,
            error: 'Đã xảy ra lỗi trong quá trình xác minh',
            code: 'INTERNAL_ERROR'
        };
    }
}
