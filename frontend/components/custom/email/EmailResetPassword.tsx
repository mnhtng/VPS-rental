import {
    Button,
    Heading,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import EmailLayout from "@/components/custom/email/EmailLayout";
import { EmailResetPasswordTemplateProps } from "@/types/types";

const EmailResetPasswordTemplate = ({
    name = "Khách hàng",
    resetUrl,
}: EmailResetPasswordTemplateProps) => {

    return (
        <EmailLayout preview="Bạn đã yêu cầu đặt lại mật khẩu • Link có hiệu lực trong 60 phút">
            <Section style={wrapper}>
                <div style={iconContainer}>
                    <Text style={lockIcon}>🔐</Text>
                </div>

                <Heading style={title}>Đặt lại mật khẩu</Heading>

                <Text style={text}>
                    Xin chào <strong>{name}</strong>,
                </Text>

                <Text style={text}>
                    Hệ thống PCloud nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.
                    Click nút bên dưới để tạo mật khẩu mới.
                </Text>

                <Section style={buttonContainer}>
                    <Button style={button} href={resetUrl}>
                        Thiết Lập Mật Khẩu Mới
                    </Button>
                </Section>

                <Section style={warningCard}>
                    <Text style={warningTitle}>⚠️ LƯU Ý BẢO MẬT</Text>
                    <Text style={warningText}>
                        • Link chỉ có hiệu lực trong <strong>60 phút</strong>.<br />
                        • Không chia sẻ email này cho bất kỳ ai.<br />
                        • Nếu bạn không yêu cầu, hãy bỏ qua email này.
                    </Text>
                </Section>

                <Text style={subText}>
                    Nếu nút bên trên không hoạt động, hãy copy link này vào trình duyệt:
                </Text>
                <code style={codeBlock}>{resetUrl}</code>
            </Section>
        </EmailLayout>
    );
};

export default EmailResetPasswordTemplate;

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE COLOR PALETTE - "Midnight Teal" with Rose Accent
// Primary: Teal #14B8A6, Dark: #0F172A
// Security Accent: Rose #FB7185
// ═══════════════════════════════════════════════════════════════════════════════

const wrapper = {
    textAlign: 'center' as const,
};

const iconContainer = {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', // Rose 50
    borderRadius: '50%',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #FECDD3', // Rose 200
};

const lockIcon = {
    fontSize: '32px',
    margin: '0',
    lineHeight: '72px',
};

const title = {
    color: '#0F172A',
    fontSize: '26px',
    fontWeight: '800',
    margin: '0 0 24px',
    letterSpacing: '-0.5px',
};

const text = {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px',
    textAlign: 'left' as const,
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    background: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)', // Rose gradient
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 36px',
    boxShadow: '0 8px 16px -4px rgba(225, 29, 72, 0.4)',
};

const warningCard = {
    background: 'linear-gradient(to right, #FFF7ED, #FFEDD5)', // Orange 50
    border: '1px solid #FDBA74', // Orange 300
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'left' as const,
    marginBottom: '24px',
};

const warningTitle = {
    color: '#9A3412', // Orange 800
    fontSize: '13px',
    fontWeight: '800',
    marginBottom: '8px',
};

const warningText = {
    color: '#C2410C', // Orange 700
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
};

const subText = {
    color: '#64748B',
    fontSize: '14px',
    margin: '0 0 8px',
    textAlign: 'left' as const,
};

const codeBlock = {
    display: 'block',
    padding: '14px',
    background: '#F0FDFA', // Teal 50
    borderRadius: '8px',
    color: '#0F766E', // Teal 700
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '12px',
    overflowWrap: 'break-word' as const,
    textAlign: 'left' as const,
    border: '1px solid #99F6E4', // Teal 200
};