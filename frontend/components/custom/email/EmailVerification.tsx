import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from "@react-email/components";

interface EmailVerificationTemplateProps {
    name: string;
    verificationUrl: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : '';

const EmailVerificationTemplate = ({
    name = "Khách hàng",
    verificationUrl,
}: EmailVerificationTemplateProps) => {
    return (
        <Html>
            <Head />
            <Preview>Xác minh địa chỉ email của bạn - VPS Rental</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src={`${baseUrl}/logo.png`}
                            width="40"
                            height="40"
                            alt="VPS Rental"
                            style={logo}
                        />
                        <Heading style={h1}>VPS Rental</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h2}>Xác minh địa chỉ email của bạn</Heading>

                        <Text style={text}>
                            Xin chào {name},
                        </Text>

                        <Text style={text}>
                            Cảm ơn bạn đã đăng ký tài khoản tại VPS Rental! Để hoàn tất quá trình đăng ký và kích hoạt tài khoản của bạn, vui lòng xác minh địa chỉ email bằng cách click vào nút bên dưới.
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={verificationUrl}>
                                Xác minh Email
                            </Button>
                        </Section>

                        <Text style={smallText}>
                            Hoặc copy và dán link sau vào trình duyệt của bạn:
                        </Text>
                        <Text style={linkText}>{verificationUrl}</Text>

                        <Text style={warningText}>
                            ⚠️ Link xác minh này sẽ hết hạn trong 24 giờ.
                        </Text>

                        <Text style={text}>
                            Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
                        </Text>

                        <Text style={signature}>
                            Trân trọng,<br />
                            VPS Rental Team
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © 2025 VPS Rental. Tất cả quyền được bảo lưu.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
};

const header = {
    padding: "32px 20px",
    textAlign: "center" as const,
};

const logo = {
    display: "inline-block",
    marginBottom: "16px",
};

const h1 = {
    color: "#1f2937",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0",
};

const content = {
    padding: "0 20px",
};

const h2 = {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "32px 0 16px",
    textAlign: "center" as const,
};

const text = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "16px 0",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#2563eb",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
};

const smallText = {
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "24px 0 8px",
    textAlign: "center" as const,
};

const linkText = {
    color: "#2563eb",
    fontSize: "14px",
    textDecoration: "underline",
    wordBreak: "break-all" as const,
    margin: "0 0 16px",
    textAlign: "center" as const,
};

const warningText = {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: "600",
    margin: "24px 0",
    textAlign: "center" as const,
};

const signature = {
    color: "#374151",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "32px 0",
};

const footer = {
    borderTop: "1px solid #e5e7eb",
    padding: "20px",
    textAlign: "center" as const,
};

const footerText = {
    color: "#6b7280",
    fontSize: "12px",
    margin: "0",
};

export default EmailVerificationTemplate;