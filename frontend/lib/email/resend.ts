'use server';

import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import EmailVerificationTemplate from '@/components/custom/email/EmailVerification';
import EmailResetPasswordTemplate from '@/components/custom/email/EmailResetPassword';
import EmailOrderConfirmation from '@/components/custom/email/EmailOrderConfirmation';
import EmailVPSWelcome from '@/components/custom/email/EmailVPSWelcome';
import InvoicePDF from '@/components/custom/pdf/InvoicePDF';
import VPSWelcomePDF from '@/components/custom/pdf/VPSWelcomePDF';
import { OrderConfirmationEmailData, VPSWelcomeEmailData } from '@/types/types';

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
            subject: '[PCloud] Yêu cầu đặt lại mật khẩu',
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
            console.error('>>> Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }

        return data;
    } catch (error) {
        console.error('>>> Error in sendPasswordResetMail:', error);
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
            subject: '[PCloud] Xác thực email để hoàn tất đăng ký',
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
            console.error('>>> Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }

        return data;
    } catch (error) {
        console.error('>>> Error in sendVerificationMail:', error);
        throw error;
    }
};

export const sendOrderConfirmationEmail = async (data: OrderConfirmationEmailData) => {
    try {
        // Render PDF to Buffer
        const pdfBuffer = await renderToBuffer(
            InvoicePDF({
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                customerAddress: data.customerAddress,
                orderNumber: data.orderNumber,
                orderDate: data.orderDate,
                vpsItems: data.vpsItems,
                subtotal: data.subtotal,
                discount: data.discount,
                total: data.total,
                paymentMethod: data.paymentMethod,
                transactionId: data.transactionId,
            })
        );

        // Convert Buffer to Base64 for attachment
        const pdfBase64 = pdfBuffer.toString('base64');

        const { data: emailData, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL as string,
            to: [data.customerEmail],
            subject: `[PCloud] Xác nhận đơn hàng #${data.orderNumber}`,
            react: EmailOrderConfirmation({
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                orderNumber: data.orderNumber,
                orderDate: data.orderDate,
                vpsItems: data.vpsItems,
                subtotal: data.subtotal,
                discount: data.discount,
                total: data.total,
                paymentMethod: data.paymentMethod,
                transactionId: data.transactionId,
            }),
            attachments: [
                {
                    filename: `Invoice-${data.orderNumber}.pdf`,
                    content: pdfBase64,
                },
            ],
            text: `
        Xin chào ${data.customerName},

        Cảm ơn bạn đã mua VPS tại PCloud!

        THÔNG TIN ĐƠN HÀNG:
        - Số đơn hàng: ${data.orderNumber}
        - Ngày đặt: ${data.orderDate}
        - Phương thức thanh toán: ${data.paymentMethod}
        ${data.transactionId ? `- Mã giao dịch: ${data.transactionId}` : ''}
        
        TỔNG THANH TOÁN: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.total)}

        VPS của bạn sẽ được kích hoạt trong vòng 5-10 phút.
        Thông tin đăng nhập sẽ được gửi trong email tiếp theo.

        File PDF hóa đơn chi tiết đã được đính kèm trong email này.

        Nếu cần hỗ trợ, vui lòng liên hệ:
        - Email: support@ptitcloud.io.vn
        - Hotline: +84 789 318 158

        Trân trọng,
        PCloud Team
      `,
        });

        if (error) {
            console.error('>>> Failed to send order confirmation email:', error);
            throw new Error('Failed to send order confirmation email');
        }

        return emailData;
    } catch (error) {
        console.error('>>> Error in sendOrderConfirmationEmail:', error);
        throw error;
    }
};

export const sendVPSWelcomeEmail = async (data: VPSWelcomeEmailData) => {
    try {
        // Render PDF to Buffer
        const pdfBuffer = await renderToBuffer(
            VPSWelcomePDF({
                customerName: data.customerName,
                orderNumber: data.orderNumber,
                orderDate: data.orderDate,
                vps: data.vps,
                credentials: data.credentials,
            })
        );

        // Convert Buffer to Base64
        const pdfBase64 = pdfBuffer.toString('base64');

        const { data: emailData, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL as string,
            to: [data.customerEmail],
            subject: `[PCloud] VPS ${data.vps.name} đã sẵn sàng - Thông tin đăng nhập`,
            react: EmailVPSWelcome({
                customerName: data.customerName,
                orderNumber: data.orderNumber,
                vps: data.vps,
                credentials: data.credentials,
            }),
            attachments: [
                {
                    filename: `VPS-Guide-${data.orderNumber}-${data.vps.hostname}.pdf`,
                    content: pdfBase64,
                },
            ],
            text: `
        Xin chào ${data.customerName},

        VPS ${data.vps.name} của bạn đã được kích hoạt thành công!

        THÔNG TIN ĐĂNG NHẬP:
        - IP Address: ${data.credentials.ipAddress}
        - Username: ${data.credentials.username}
        - Password: ${data.credentials.password}
        - SSH Port: ${data.credentials.sshPort}

        Lệnh kết nối SSH:
        ssh ${data.credentials.username}@${data.credentials.ipAddress} -p ${data.credentials.sshPort}

        THÔNG SỐ VPS:
        - ${data.vps.cpu} vCPU
        - ${data.vps.ram} GB RAM
        - ${data.vps.storage} GB SSD
        - ${data.vps.network_speed} Mbps
        - OS: ${data.vps.os}

        File PDF hướng dẫn sử dụng đã được đính kèm trong email này.

        Nếu cần hỗ trợ, vui lòng liên hệ:
        - Email: support@ptitcloud.io.vn
        - Hotline: +84 789 318 158

        Trân trọng,
        PCloud Team
      `,
        });

        if (error) {
            console.error('>>> Failed to send VPS welcome email:', error);
            throw new Error('Failed to send VPS welcome email');
        }

        return emailData;
    } catch (error) {
        console.error('>>> Error in sendVPSWelcomeEmail:', error);
        throw error;
    }
};