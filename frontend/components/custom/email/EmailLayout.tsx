import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayoutProps } from "@/types/types";

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'https://mnhtng.site';

export const EmailLayout = ({
    preview = "Thông báo từ PCloud",
    children,
}: EmailLayoutProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <div style={headerContent}>
                            <Img
                                src={`${baseUrl}/bg.png`}
                                width="48"
                                height="48"
                                alt="PCloud"
                                style={logo}
                            />
                            <Heading style={brandName}>PCloud</Heading>
                        </div>
                        <Text style={tagline}>Premium VPS Hosting</Text>
                    </Section>

                    <Section style={content}>
                        {children}
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © {currentYear} PCloud VPS Services.
                        </Text>
                        <Text style={{ ...footerText, marginTop: '4px' }}>
                            <Link href={`${baseUrl}`} style={footerLink}>Trang chủ</Link>
                            {' • '}
                            <Link href={`${baseUrl}/privacy`} style={footerLink}>Bảo mật</Link>
                            {' • '}
                            <Link href={`${baseUrl}/support`} style={footerLink}>Hỗ trợ</Link>
                        </Text>
                        <Text style={footerDisclaimer}>
                            Email này được gửi tự động từ hệ thống PCloud.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default EmailLayout;

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE COLOR PALETTE - "Midnight Teal"
// Primary: Dark Slate #0F172A → Teal #14B8A6
// Accent: Coral Rose #FB7185
// Background: Cool Gray #F9FAFB
// ═══════════════════════════════════════════════════════════════════════════════

const main = {
    backgroundColor: '#F0F4F8', // Cool blue-gray background
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '40px 0',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    maxWidth: '600px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)', // Deep shadow
};

const header = {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #14B8A6 100%)', // Dark Slate → Deep Blue → Teal
    padding: '32px 30px 28px',
    textAlign: 'center' as const,
};

const headerContent = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const logo = {
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
};

const brandName = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 0 0 15px',
    letterSpacing: '-0.5px',
    fontFamily: 'inherit',
    display: 'inline-block',
    verticalAlign: 'middle',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

const tagline = {
    color: '#5EEAD4', // Teal 300
    fontSize: '13px',
    fontWeight: '500',
    margin: '8px 0 0',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
};

const content = {
    padding: '40px 40px',
};

const footer = {
    backgroundColor: '#0F172A', // Dark Slate
    padding: '28px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#94A3B8', // Slate 400
    fontSize: '13px',
    margin: '0',
    fontWeight: '500',
};

const footerLink = {
    color: '#5EEAD4', // Teal 300
    textDecoration: 'none',
    fontWeight: '600',
};

const footerDisclaimer = {
    color: '#64748B', // Slate 500
    fontSize: '11px',
    marginTop: '12px',
    fontStyle: 'italic',
};
