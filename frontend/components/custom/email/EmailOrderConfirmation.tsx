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
import { EmailOrderConfirmationProps } from "@/types/types";
import { formatPrice } from "@/utils/currency";

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://mnhtng.site';

const EmailOrderConfirmation = ({
    customerName = "Khách hàng",
    customerEmail = "customer@example.com",
    orderNumber = "VPS-1234567890",
    orderDate = new Date().toLocaleDateString('vi-VN'),
    vpsItems = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    paymentMethod = "MoMo",
    transactionId = "N/A",
}: EmailOrderConfirmationProps) => {
    return (
        <EmailLayout preview={`Đơn hàng #${orderNumber} đã được xác nhận • Tổng thanh toán: ${formatPrice(total)}`}>
            {/* Success Banner */}
            <Section style={wrapper}>
                <div style={iconWrapper}>
                    <Text style={checkIcon}>🛍</Text>
                </div>
                <Heading style={successTitle}>Thanh toán thành công!</Heading>
                <Text style={successText}>
                    Cảm ơn bạn đã tin tưởng dịch vụ VPS chất lượng cao từ PCloud.
                </Text>
            </Section>

            {/* Order Info Grid */}
            <Section style={gridContainer}>
                <Row>
                    <Column style={gridCol}>
                        <Text style={label}>MÃ ĐƠN HÀNG</Text>
                        <Text style={valueMono}>#{orderNumber}</Text>
                    </Column>
                    <Column style={gridCol}>
                        <Text style={label}>NGÀY ĐẶT</Text>
                        <Text style={value}>{orderDate}</Text>
                    </Column>
                </Row>
                <Row style={{ marginTop: '15px' }}>
                    <Column style={gridCol}>
                        <Text style={label}>THANH TOÁN</Text>
                        <Text style={value}>{paymentMethod}</Text>
                    </Column>
                    <Column style={gridCol}>
                        <Text style={label}>TỔNG CỘNG</Text>
                        <Text style={totalValueHighlight}>{formatPrice(total)}</Text>
                    </Column>
                </Row>
            </Section>

            <Hr style={divider} />

            {/* VPS Items */}
            <Heading style={sectionTitle}>CHI TIẾT DỊCH VỤ</Heading>

            {vpsItems.map((item, index) => (
                <Section key={index} style={itemCard}>
                    <Row style={cardHeader}>
                        <Column>
                            <Heading style={cardTitle}>{item.name}</Heading>
                        </Column>
                        <Column style={{ textAlign: 'right' }}>
                            <Text style={priceBadge}>{formatPrice(item.total_price || 0)}</Text>
                        </Column>
                    </Row>

                    <div style={cardBody}>
                        <Row style={specRow}>
                            <Column style={specCol}>
                                <Text style={specLabel}>Hostname</Text>
                                <Text style={specValueMono}>{item.hostname}</Text>
                            </Column>
                            <Column style={specCol}>
                                <Text style={specLabel}>Bandwidth</Text>
                                <Text style={specValueMono}>Unlimited</Text>
                            </Column>
                        </Row>
                        <Row style={specRow}>
                            <Column style={specCol}>
                                <Text style={specLabel}>OS</Text>
                                <Text style={specValue}>{item.os}</Text>
                            </Column>
                            <Column style={specCol}>
                                <Text style={specLabel}>Thời hạn</Text>
                                <Text style={specValue}>{item.duration_months} tháng</Text>
                            </Column>
                        </Row>
                    </div>

                    <div style={techSpecs}>
                        <Text style={techSpecItem}>⚡ {item.cpu} vCPU</Text>
                        <Text style={techSpecItem}>🚀 {item.ram} GB RAM</Text>
                        <Text style={techSpecItem}>💾 {item.storage} GB {item.storage_type}</Text>
                        <Text style={techSpecItem}>🌐 {item.network_speed < 1000 ? item.network_speed : Math.round(item.network_speed / 1000).toFixed(1)} {item.network_speed < 1000 ? 'Mbps' : 'Gbps'} </Text>
                    </div>
                </Section>
            ))}

            {/* Next Steps */}
            <Heading style={sectionTitle}>BƯỚC TIẾP THEO</Heading>
            <Section style={stepsContainer}>
                <div style={stepItem}>
                    <div style={stepNumber}>1</div>
                    <div style={stepContent}>
                        <Text style={stepTitle}>Kiểm tra Email Invoice</Text>
                        <Text style={stepDesc}>Hóa đơn PDF đã được đính kèm trong email này.</Text>
                    </div>
                </div>
                <div style={stepItem}>
                    <div style={stepNumber}>2</div>
                    <div style={stepContent}>
                        <Text style={stepTitle}>Chờ Kích Hoạt (5-10 phút)</Text>
                        <Text style={stepDesc}>Hệ thống đang khởi tạo VPS của bạn tự động.</Text>
                    </div>
                </div>
                <div style={stepItem}>
                    <div style={stepNumber}>3</div>
                    <div style={stepContent}>
                        <Text style={stepTitle}>Quản Lý VPS</Text>
                        <Text style={stepDesc}>Truy cập Dashboard để lấy thông tin đăng nhập.</Text>
                    </div>
                </div>
            </Section>

            <Section style={buttonContainer}>
                <Button style={primaryButton} href={`${baseUrl}/client-dashboard`}>
                    Truy cập Dashboard
                </Button>
            </Section>

            {/* Invoice Download Box */}
            <Section style={downloadBox}>
                <Row>
                    <Column style={{ width: '60%' }}>
                        <Text style={downloadTitle}>HÓA ĐƠN ĐIỆN TỬ</Text>
                        <Text style={downloadFile}>📎 Invoice-{orderNumber}.pdf</Text>
                    </Column>
                    <Column style={{ width: '40%', textAlign: 'right' }}>
                        <Button style={downloadButtonSmall} href={`${baseUrl}/api/orders/${orderNumber}/download-invoice`}>
                            Tải Ngay ↓
                        </Button>
                    </Column>
                </Row>
            </Section>

            <Text style={supportText}>
                Nếu bạn cần hỗ trợ, vui lòng liên hệ <Link style={link} href="mailto:support@pcloud.com">support@pcloud.com</Link>
            </Text>

        </EmailLayout>
    );
};

export default EmailOrderConfirmation;

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE COLOR PALETTE - "Midnight Teal"
// Primary: #14B8A6 (Teal 500), Dark: #0F172A (Slate 900)
// Accent: #FB7185 (Rose 400), #F97316 (Orange 500)
// Success: #10B981 (Emerald 500)
// ═══════════════════════════════════════════════════════════════════════════════

const wrapper = {
    textAlign: 'center' as const,
    marginBottom: '20px',
};

const iconWrapper = {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #F7FEE7 0%, #ECFCCA 100%)',
    borderRadius: '50%',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #BBF451',
};

const checkIcon = {
    fontSize: '32px',
    margin: '0',
    lineHeight: '72px',
};

const successTitle = {
    color: '#064E3B', // Emerald 900
    fontSize: '22px',
    fontWeight: '800',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
};

const successText = {
    color: '#047857', // Emerald 700
    fontSize: '15px',
    margin: '0',
};

// Grid Info
const gridContainer = {
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
};

const gridCol = {
    width: '50%',
    paddingRight: '10px',
};

const label = {
    color: '#64748B',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '4px',
};

const value = {
    color: '#0F172A',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0',
};

const valueMono = {
    ...value,
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    color: '#0D9488', // Teal 600
};

const totalValueHighlight = {
    ...value,
    color: '#F97316', // Orange 500 - Unique accent
    fontSize: '18px',
    fontWeight: '800',
};

const divider = {
    borderColor: '#E2E8F0',
    margin: '24px 0',
};

const sectionTitle = {
    color: '#0F172A',
    fontSize: '14px',
    fontWeight: '800',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    margin: '0 0 20px',
    borderLeft: '4px solid #14B8A6', // Teal
    paddingLeft: '12px',
};

// Item Card
const itemCard = {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
};

const cardHeader = {
    background: 'linear-gradient(to right, #0F172A, #1E3A5F)', // Dark gradient
    padding: '18px 24px',
};

const cardTitle = {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    margin: '0',
};

const priceBadge = {
    backgroundColor: '#14B8A6', // Teal
    color: '#ffffff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    display: 'inline-block',
};

const cardBody = {
    padding: '24px',
};

const specRow = {
    marginBottom: '12px',
};

const specCol = {
    width: '50%',
};

const specLabel = {
    color: '#64748B',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    marginBottom: '2px',
    letterSpacing: '0.05em',
};

const specValue = {
    color: '#334155',
    fontSize: '14px',
    fontWeight: '600',
};

const specValueMono = {
    ...specValue,
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    color: '#0D9488', // Teal 600
};

const techSpecs = {
    backgroundColor: '#F0FDFA', // Teal 50
    padding: '14px 24px',
    borderTop: '1px solid #CCFBF1', // Teal 100
};

const techSpecItem = {
    fontSize: '12px',
    color: '#0F766E', // Teal 700
    margin: '0 16px 0 0',
    fontWeight: '600',
    display: 'inline-block',
};

// Steps
const stepsContainer = {
    marginBottom: '32px',
};

const stepItem = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '20px',
};

const stepNumber = {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
    color: '#5EEAD4', // Teal 300
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    textAlign: 'center' as const,
    fontSize: '14px',
    lineHeight: '32px',
    fontWeight: 'bold',
    marginRight: '16px',
    marginTop: '2px',
    boxShadow: '0 4px 8px rgba(15, 23, 42, 0.2)',
};

const stepContent = {
    flex: 1,
};

const stepTitle = {
    color: '#0F172A',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 4px',
};

const stepDesc = {
    color: '#64748B',
    fontSize: '14px',
    margin: '0',
    lineHeight: '1.5',
};

// Buttons
const buttonContainer = {
    textAlign: 'center' as const,
    marginBottom: '32px',
};

const primaryButton = {
    background: 'linear-gradient(135deg, #0F172A 0%, #14B8A6 100%)',
    color: '#ffffff',
    padding: '16px 36px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 8px 16px -4px rgba(20, 184, 166, 0.4)',
};

// Download Box
const downloadBox = {
    background: 'linear-gradient(to right, #FFF7ED, #FFEDD5)', // Orange 50
    border: '2px dashed #F97316', // Orange 500
    borderRadius: '12px',
    padding: '20px 24px',
    marginBottom: '24px',
};

const downloadTitle = {
    color: '#C2410C', // Orange 700
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    margin: '0 0 4px',
};

const downloadFile = {
    color: '#9A3412', // Orange 800
    fontSize: '14px',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    margin: '0',
};

const downloadButtonSmall = {
    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 8px -2px rgba(249, 115, 22, 0.4)',
};

const supportText = {
    fontSize: '13px',
    color: '#94A3B8',
    textAlign: 'center' as const,
    lineHeight: '1.5',
};

const link = {
    color: '#0D9488', // Teal 600
    textDecoration: 'none',
    fontWeight: '600',
};
