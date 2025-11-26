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

interface EmailResetPasswordTemplateProps {
    name: string;
    resetUrl: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://mnhtng.site';

const EmailResetPasswordTemplate = ({
    name = "Khách hàng",
    resetUrl,
}: EmailResetPasswordTemplateProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <Html>
            <Head />
            <Preview>Đặt lại mật khẩu của bạn - PCloud</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            // src={`${baseUrl}/logo.png`}
                            src={`${baseUrl}/bg.png`}
                            width="60"
                            height="60"
                            alt="PCloud"
                            style={logo}
                        />
                        <Heading style={h1}>PCloud</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading style={h2}>Đặt lại mật khẩu của bạn</Heading>

                        <Text style={text}>
                            Xin chào {name},
                        </Text>

                        <Text style={text}>
                            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản PCloud của bạn.
                            Nếu bạn đã thực hiện yêu cầu này, vui lòng click vào nút bên dưới để tạo mật khẩu mới.
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={resetUrl}>
                                Đặt lại mật khẩu
                            </Button>
                        </Section>

                        <Text style={smallText}>
                            Hoặc copy và dán link sau vào trình duyệt của bạn:
                        </Text>
                        <Text style={linkText}>{resetUrl}</Text>

                        <Section style={warningBox}>
                            <Text style={warningTitle}>
                                🔐 Thông tin bảo mật quan trọng:
                            </Text>
                            <Text style={warningText}>
                                • Link đặt lại mật khẩu này sẽ hết hạn trong <strong>1 giờ</strong><br />
                                • Link chỉ có thể sử dụng một lần duy nhất<br />
                                • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này<br />
                                • Để bảo mật, không chia sẻ link này với bất kỳ ai
                            </Text>
                        </Section>

                        <Text style={text}>
                            <strong>Lưu ý bảo mật:</strong> Nếu bạn không thực hiện yêu cầu này,
                            có thể ai đó đang cố gắng truy cập tài khoản của bạn. Trong trường hợp này,
                            vui lòng đổi mật khẩu ngay lập tức và liên hệ với chúng tôi.
                        </Text>

                        <Text style={signature}>
                            Trân trọng,<br />
                            PCloud Team
                        </Text>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            © {currentYear} PCloud. Tất cả quyền được bảo lưu.<br />
                            Email này được gửi từ hệ thống bảo mật tự động.
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
    padding: "20px",
    textAlign: "center" as const,
};

const logo = {
    display: "inline-block",
    marginBottom: "16px",
};

const h1 = {
    color: "#1f2937",
    fontSize: "36px",
    fontWeight: "700",
    margin: "0",
};

const content = {
    padding: "0 20px",
};

const h2 = {
    color: "#dc2626", // Red color for security/password reset
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
    backgroundColor: "#dc2626", // Red button for password reset
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
    color: "#dc2626", // Red link for security
    fontSize: "14px",
    textDecoration: "underline",
    wordBreak: "break-all" as const,
    margin: "0 0 16px",
    textAlign: "center" as const,
};

const warningBox = {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "16px",
    margin: "24px 0",
};

const warningTitle = {
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 8px 0",
};

const warningText = {
    color: "#7f1d1d",
    fontSize: "14px",
    lineHeight: "20px",
    margin: "0",
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
    lineHeight: "16px",
};

export default EmailResetPasswordTemplate;