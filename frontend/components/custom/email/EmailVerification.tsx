import {
    Button,
    Heading,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import EmailLayout from "@/components/custom/email/EmailLayout";
import { EmailVerificationTemplateProps } from "@/types/types";

const EmailVerificationTemplate = ({
    name = "Khách hàng",
    verificationUrl,
}: EmailVerificationTemplateProps) => {
    return (
        <EmailLayout preview="Chào mừng bạn đến với PCloud! Xác thực email để kích hoạt tài khoản">
            <Section style={wrapper}>
                <div style={iconContainer}>
                    <Text style={mailIcon}>✉️</Text>
                </div>

                <Heading style={title}>Xác Thực Email</Heading>

                <Text style={text}>
                    Xin chào <strong>{name}</strong>,
                </Text>

                <Text style={text}>
                    Cảm ơn bạn đã đăng ký dịch vụ tại <strong>PCloud</strong>.
                    Để đảm bảo an toàn và kích hoạt đầy đủ tính năng, vui lòng xác thực địa chỉ email của bạn.
                </Text>

                <Section style={buttonContainer}>
                    <Button style={button} href={verificationUrl}>
                        Xác Thực Ngay
                    </Button>
                </Section>

                <Section style={infoBox}>
                    <Text style={infoText}>
                        ⏰ Link xác thực sẽ hết hạn trong <strong>24 giờ</strong>.
                    </Text>
                </Section>

                <div style={divider} />

                <Text style={smallText}>
                    Nếu bạn gặp vấn đề với nút bấm trên, hãy copy link bên dưới:
                </Text>
                <code style={codeBlock}>{verificationUrl}</code>
            </Section>
        </EmailLayout>
    );
};

export default EmailVerificationTemplate;

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE COLOR PALETTE - "Midnight Teal" 
// Primary: Teal #14B8A6, Dark: #0F172A
// ═══════════════════════════════════════════════════════════════════════════════

const wrapper = {
    textAlign: 'center' as const,
};

const iconContainer = {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)', // Teal 50
    borderRadius: '50%',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #5EEAD4', // Teal 300
};

const mailIcon = {
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
    margin: '32px 0 24px',
};

const button = {
    background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', // Teal gradient
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 44px',
    boxShadow: '0 8px 16px -4px rgba(20, 184, 166, 0.4)',
};

const infoBox = {
    backgroundColor: '#F0FDFA', // Teal 50
    border: '1px solid #99F6E4', // Teal 200
    borderRadius: '10px',
    padding: '14px 20px',
    marginBottom: '24px',
};

const infoText = {
    color: '#0F766E', // Teal 700
    fontSize: '14px',
    margin: '0',
    fontWeight: '500',
};

const divider = {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #CBD5E1, transparent)',
    margin: '24px 0',
};

const smallText = {
    color: '#94A3B8',
    fontSize: '13px',
    marginBottom: '8px',
    textAlign: 'left' as const,
};

const codeBlock = {
    display: 'block',
    padding: '14px',
    background: '#F8FAFC', // Slate 50
    borderRadius: '8px',
    color: '#475569',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '11px',
    overflowWrap: 'break-word' as const,
    textAlign: 'left' as const,
    border: '1px solid #E2E8F0',
};