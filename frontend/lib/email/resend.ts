'use server';

import { Resend } from 'resend';
import EmailVerificationTemplate from '@/components/custom/email/EmailVerification';
import EmailResetPasswordTemplate from '@/components/custom/email/EmailResetPassword';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
    to: string,
    resetUrl: string,
    name: string
) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL as string,
            to: [to],
            subject: 'Đặt lại mật khẩu của bạn - PCloud',
            react: EmailResetPasswordTemplate({
                name,
                resetUrl
            }),
            text: `
        Xin chào ${name},

        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản PCloud của bạn.

        Để đặt lại mật khẩu, vui lòng click vào link bên dưới:
        ${resetUrl}

        🔐 Thông tin bảo mật quan trọng:
        • Link đặt lại mật khẩu này sẽ hết hạn trong 1 giờ
        • Link chỉ có thể sử dụng một lần duy nhất
        • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
        • Để bảo mật, không chia sẻ link này với bất kỳ ai

        Nếu bạn không thực hiện yêu cầu này, có thể ai đó đang cố gắng truy cập tài khoản của bạn.
        Trong trường hợp này, vui lòng đổi mật khẩu ngay lập tức và liên hệ với chúng tôi.

        Trân trọng,
        PCloud Team
      `,
        });

        if (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }

        console.log('Password reset email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Error in sendPasswordResetEmail:', error);
        throw error;
    }
};

export const sendVerificationMail = async (
    to: string,
    verificationUrl: string,
    name: string
) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL as string,
            to: [to],
            subject: 'Xác minh địa chỉ email của bạn - PCloud',
            react: EmailVerificationTemplate({
                name,
                verificationUrl
            }),
            text: `
        Xin chào ${name},

        Cảm ơn bạn đã đăng ký tài khoản tại PCloud!

        Để hoàn tất quá trình đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách click vào link bên dưới:
        
        ${verificationUrl}

        Link xác minh này sẽ hết hạn trong 24 giờ.

        Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.

        Trân trọng,
        PCloud Team
      `,
        });

        if (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }

        console.log('Verification email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Error in sendEmailVerificationOnly:', error);
        throw error;
    }
};