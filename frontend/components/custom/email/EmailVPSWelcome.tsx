import {
    Button,
    Heading,
    Hr,
    Row,
    Column,
    Section,
    Text,
    Link,
} from "@react-email/components";
import * as React from "react";
import EmailLayout from "@/components/custom/email/EmailLayout";
import { EmailVPSWelcomeProps } from "@/types/types";

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'https://mnhtng.site';

const EmailVPSWelcome = ({
    customerName = "Khách hàng",
    orderNumber = "VPS-1234567890",
    vps = {
        name: "VPS Pro",
        hostname: "server1.example.com",
        os: "Ubuntu 22.04 LTS",
        cpu: 4,
        ram: 8,
        storage: 100,
        storage_type: "SSD",
        network_speed: 1000,
    },
    credentials = {
        ipAddress: "192.168.1.1",
        subIpAddress: "10.10.1.1",
        username: "root",
        password: "********",
        sshPort: 22,
    },
}: EmailVPSWelcomeProps) => {
    return (
        <EmailLayout preview={`VPS ${vps.name} đã online! ${vps.cpu} vCPU • ${vps.ram}GB RAM • Thông tin đăng nhập bên trong`}>
            {/* Success Banner */}
            <Section style={wrapper}>
                <div style={iconWrapper}>
                    <Text style={rocketIcon}>🚀</Text>
                </div>
                <Heading style={successTitle}>VPS Đã Kích Hoạt!</Heading>
                <Text style={successText}>
                    VPS của bạn đã sẵn sàng sử dụng. Dưới đây là thông tin đăng nhập.
                </Text>
            </Section>

            {/* VPS Info Card */}
            <Section style={infoCard}>
                <Heading style={cardTitle}>{vps.name}</Heading>
                <Text style={orderNumberText}>Đơn hàng: #{orderNumber}</Text>

                <Hr style={cardDivider} />

                <Row>
                    <Column style={specColumn}>
                        <Text style={specLabel}>HOSTNAME</Text>
                        <Text style={specValueMono}>{vps.hostname}</Text>
                    </Column>
                    <Column style={specColumn}>
                        <Text style={specLabel}>HỆ ĐIỀU HÀNH</Text>
                        <Text style={specValue}>{vps.os}</Text>
                    </Column>
                </Row>

                <div style={specsBar}>
                    <Text style={specBadge}>{vps.cpu} vCPU</Text>
                    <Text style={specBadge}>{vps.ram} GB RAM</Text>
                    <Text style={specBadge}>{vps.storage < 1000 ? vps.storage : Math.round(vps.storage / 1000).toFixed(1)} {vps.storage < 1000 ? 'GB' : 'TB'} {vps.storage_type}</Text>
                    <Text style={specBadge}>{vps.network_speed < 1000 ? vps.network_speed : Math.round(vps.network_speed / 1000).toFixed(1)} {vps.network_speed < 1000 ? 'Mbps' : 'Gbps'}</Text>
                </div>
            </Section>

            {/* Credentials Card - Important */}
            <Section style={credentialsCard}>
                <Heading style={credentialsTitle}>🔐 THÔNG TIN ĐĂNG NHẬP</Heading>
                <Text style={credentialsWarning}>
                    Vui lòng lưu giữ thông tin này an toàn. Không chia sẻ với người khác.
                </Text>

                <div style={credentialsGrid}>
                    <div style={credentialItem}>
                        <Text style={credentialLabel}>
                            IP Address 1 / IP Address 2
                        </Text>
                        <Text style={credentialValue}>
                            {credentials.ipAddress} / {credentials.subIpAddress}
                        </Text>
                    </div>
                    <div style={credentialItem}>
                        <Text style={credentialLabel}>Username</Text>
                        <Text style={credentialValue}>{credentials.username}</Text>
                    </div>
                    <div style={credentialItem}>
                        <Text style={credentialLabel}>Password</Text>
                        <Text style={credentialValue}>{credentials.password}</Text>
                    </div>
                    <div style={credentialItem}>
                        <Text style={credentialLabel}>SSH Port</Text>
                        <Text style={credentialValue}>{credentials.sshPort}</Text>
                    </div>
                </div>

                {/* SSH Command */}
                <div style={commandBox}>
                    <Text style={commandLabel}>LỆNH KẾT NỐI SSH:</Text>
                    <code style={commandCode}>
                        ssh {credentials.username}@{credentials.ipAddress} -p {credentials.sshPort}
                    </code>
                </div>
            </Section>

            {/* Quick Actions */}
            <Section style={actionsSection}>
                <Heading style={sectionTitle}>BẮT ĐẦU SỬ DỤNG</Heading>
            </Section>

            {/* Security Tips */}
            <Section style={tipsCard}>
                <Heading style={tipsTitle}>💡 MẸO BẢO MẬT</Heading>
                <Text style={tipItem}>• Đổi mật khẩu mặc định ngay sau khi đăng nhập</Text>
                <Text style={tipItem}>• Cấu hình firewall (UFW/iptables) chỉ mở port cần thiết</Text>
                <Text style={tipItem}>• Sử dụng SSH Key thay vì password để tăng bảo mật</Text>
                <Text style={tipItem}>• Cập nhật hệ thống thường xuyên</Text>
            </Section>

            {/* Support */}
            <Text style={supportText}>
                Cần hỗ trợ? Liên hệ <Link style={link} href="mailto:support@pcloud.com">support@pcloud.com</Link> hoặc Hotline: 1900 xxxx
            </Text>

        </EmailLayout>
    );
};

export default EmailVPSWelcome;

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES - Midnight Teal Theme
// ═══════════════════════════════════════════════════════════════════════════════

const wrapper = {
    textAlign: 'center' as const,
    marginBottom: '20px',
};

const iconWrapper = {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    borderRadius: '50%',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #A3B3FF',
};

const rocketIcon = {
    fontSize: '32px',
    margin: '0',
    lineHeight: '72px',
};

const successTitle = {
    color: '#0F766E',
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 8px',
};

const successText = {
    color: '#0D9488',
    fontSize: '15px',
    margin: '0',
};

// VPS Info Card
const infoCard = {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #E2E8F0',
};

const cardTitle = {
    color: '#0F172A',
    fontSize: '20px',
    fontWeight: '800',
    margin: '0 0 4px',
};

const orderNumberText = {
    color: '#64748B',
    fontSize: '13px',
    margin: '0',
};

const cardDivider = {
    borderColor: '#E2E8F0',
    margin: '16px 0',
};

const specColumn = {
    width: '50%',
    marginBottom: '12px',
};

const specLabel = {
    color: '#64748B',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    marginBottom: '4px',
};

const specValue = {
    color: '#0F172A',
    fontSize: '14px',
    fontWeight: '600',
};

const specValueMono = {
    ...specValue,
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    color: '#0D9488',
};

const specsBar = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '16px',
};

const specBadge = {
    display: 'inline-block',
    textAlign: 'center' as const,
    backgroundColor: '#0F172A',
    color: '#5EEAD4',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px',
    marginBottom: '8px',
};

// Credentials Card
const credentialsCard = {
    backgroundColor: '#0F172A',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
};

const credentialsTitle = {
    color: '#5EEAD4',
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '0.05em',
    margin: '0 0 8px',
};

const credentialsWarning = {
    color: '#F97316',
    fontSize: '12px',
    margin: '0 0 20px',
};

const credentialsGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
};

const credentialItem = {
    backgroundColor: '#1E293B',
    padding: '12px',
    margin: '6px 0',
    borderRadius: '8px',
};

const credentialLabel = {
    color: '#94A3B8',
    fontSize: '10px',
    fontWeight: '600',
    marginBottom: '4px',
    letterSpacing: '0.05em',
};

const credentialValue = {
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontWeight: '600',
};

const commandBox = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '14px',
};

const commandLabel = {
    color: '#64748B',
    fontSize: '10px',
    fontWeight: '700',
    marginBottom: '8px',
    letterSpacing: '0.05em',
};

const commandCode = {
    color: '#5EEAD4',
    fontSize: '14px',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    wordBreak: 'break-all' as const,
};

// Actions
const actionsSection = {
    marginBottom: '6px',
};

const sectionTitle = {
    color: '#0F172A',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.1em',
    margin: '0 0 16px',
    borderLeft: '4px solid #14B8A6',
    paddingLeft: '12px',
};

// Tips Card
const tipsCard = {
    backgroundColor: '#FFF7ED',
    border: '1px solid #FDBA74',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
};

const tipsTitle = {
    color: '#C2410C',
    fontSize: '13px',
    fontWeight: '800',
    margin: '0 0 12px',
};

const tipItem = {
    color: '#9A3412',
    fontSize: '13px',
    margin: '0 0 6px',
    lineHeight: '1.5',
};

const supportText = {
    color: '#64748B',
    fontSize: '13px',
    textAlign: 'center' as const,
};

const link = {
    color: '#0D9488',
    fontWeight: '600',
    textDecoration: 'none',
};
