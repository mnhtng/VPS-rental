import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import { VPSWelcomePDFProps } from '@/types/types';

Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
            fontWeight: 'normal',
        },
        {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
            fontWeight: 'bold',
        },
    ],
});

const VPSWelcomePDF = ({
    customerName = "Khách hàng",
    orderNumber = "VPS-1234567890",
    orderDate = new Date().toLocaleDateString('vi-VN'),
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
}: VPSWelcomePDFProps) => {
    return (
        <Document>
            {/* ═══════════════════════════════════════════════════════════════════
                PAGE 1: VPS INFO & CREDENTIALS
            ═══════════════════════════════════════════════════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.brandName}>PCloud</Text>
                        <Text style={styles.brandTagline}>VPS WELCOME GUIDE</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.docType}>TÀI LIỆU HƯỚNG DẪN</Text>
                        <Text style={styles.orderNumber}>#{orderNumber}</Text>
                    </View>
                </View>

                {/* Welcome Banner */}
                <View style={styles.welcomeBanner}>
                    <Text style={styles.welcomeTitle}>VPS CỦA BẠN ĐÃ SẴN SÀNG!</Text>
                    <Text style={styles.welcomeText}>
                        Xin chào {customerName}, dưới đây là thông tin chi tiết về VPS và hướng dẫn sử dụng.
                    </Text>
                </View>

                {/* VPS Specs Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>THÔNG TIN VPS</Text>

                    <View style={styles.specsCard}>
                        <View style={styles.specsHeader}>
                            <Text style={styles.vpsName}>{vps.name}</Text>
                            <Text style={styles.vpsDate}>Ngày kích hoạt: {orderDate}</Text>
                        </View>

                        <View style={styles.specsGrid}>
                            <View style={styles.specItem}>
                                <Text style={styles.specLabel}>HOSTNAME</Text>
                                <Text style={styles.specValue}>{vps.hostname}</Text>
                            </View>
                            <View style={styles.specItem}>
                                <Text style={styles.specLabel}>HỆ ĐIỀU HÀNH</Text>
                                <Text style={styles.specValue}>{vps.os}</Text>
                            </View>
                        </View>

                        <View style={styles.techSpecs}>
                            <View style={styles.techItem}>
                                <Text style={styles.techValue}>{vps.cpu} vCPU</Text>
                            </View>
                            <View style={styles.techItem}>
                                <Text style={styles.techValue}>{vps.ram} GB RAM</Text>
                            </View>
                            <View style={styles.techItem}>
                                <Text style={styles.techValue}>{vps.storage} GB {vps.storage_type}</Text>
                            </View>
                            <View style={styles.techItem}>
                                <Text style={styles.techValue}>{vps.network_speed} MB/s</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Credentials Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>THÔNG TIN ĐĂNG NHẬP</Text>

                    <View style={styles.credentialsCard}>
                        <Text style={styles.credentialsWarning}>
                            Vui lòng bảo mật thông tin này. Không chia sẻ với người khác.
                        </Text>

                        <View style={styles.credentialsGrid}>
                            <View style={styles.credentialBox}>
                                <Text style={styles.credLabel}>
                                    IP Address 1
                                    <Text style={styles.separate}> | </Text>
                                    IP Address 2
                                </Text>
                                <Text style={styles.credValue}>
                                    {credentials.ipAddress}
                                    <Text style={styles.separate}> | </Text>
                                    {credentials.subIpAddress}
                                </Text>
                            </View>
                            <View style={styles.credentialBox}>
                                <Text style={styles.credLabel}>SSH Port</Text>
                                <Text style={styles.credValue}>{credentials.sshPort}</Text>
                            </View>
                            <View style={styles.credentialBox}>
                                <Text style={styles.credLabel}>Username</Text>
                                <Text style={styles.credValue}>{credentials.username}</Text>
                            </View>
                            <View style={styles.credentialBox}>
                                <Text style={styles.credLabel}>Password</Text>
                                <Text style={styles.credValue}>{credentials.password}</Text>
                            </View>
                        </View>

                        <View style={styles.commandBox}>
                            <Text style={styles.commandLabel}>LỆNH KẾT NỐI SSH (ÁP DỤNG VỚI VPS CÓ OS LINUX):</Text>
                            <Text style={styles.commandCode}>
                                ssh {credentials.username}@{credentials.ipAddress} -p {credentials.sshPort}
                            </Text>
                        </View>
                    </View>
                </View>
            </Page>

            {/* ═══════════════════════════════════════════════════════════════════
                PAGE 2: USAGE GUIDE
            ═══════════════════════════════════════════════════════════════════ */}
            <Page size="A4" style={styles.page}>
                {/* Guide Section 1: Connect via SSH */}
                <View style={styles.guideSection}>
                    <Text style={styles.guideTitle}>1. KẾT NỐI VPS QUA SSH (ÁP DỤNG VỚI VPS CÓ OS LINUX)</Text>

                    <View style={styles.guideContent}>
                        <Text style={styles.guideText}>
                            • Mở Terminal
                        </Text>
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeText}>
                                ssh {credentials.username}@{credentials.ipAddress} -p {credentials.sshPort}
                            </Text>
                        </View>
                        <Text style={styles.guideText}>
                            • Nhập password khi được yêu cầu
                        </Text>
                    </View>
                </View>

                {/* Guide Section 2: Connect via Remote Desktop (Windows) */}
                <View style={styles.guideSection}>
                    <Text style={styles.guideTitle}>2. KẾT NỐI VPS QUA REMOTE DESKTOP (ÁP DỤNG VỚI VPS CÓ OS WINDOWS)</Text>

                    <View style={styles.guideContent}>
                        <Text style={styles.guideText}>
                            • Nhấn Windows + R, gõ mstsc và nhấn Enter
                        </Text>
                        <Text style={styles.guideText}>
                            • Nhập Computer: {credentials.ipAddress}
                        </Text>
                        <Text style={styles.guideText}>
                            • Click Connect, nhập username và password
                        </Text>
                    </View>
                </View>

                {/* Guide Section 3: Basic Commands */}
                <View style={styles.guideSection}>
                    <Text style={styles.guideTitle}>3. CÁC LỆNH CƠ BẢN (LINUX)</Text>

                    <View style={styles.commandsGrid}>
                        <View style={styles.commandItem}>
                            <Text style={styles.cmdCode}>apt update && apt upgrade -y</Text>
                            <Text style={styles.cmdDesc}>Cập nhật hệ thống</Text>
                        </View>
                        <View style={styles.commandItem}>
                            <Text style={styles.cmdCode}>passwd</Text>
                            <Text style={styles.cmdDesc}>Đổi mật khẩu root</Text>
                        </View>
                        <View style={styles.commandItem}>
                            <Text style={styles.cmdCode}>htop</Text>
                            <Text style={styles.cmdDesc}>Xem tài nguyên hệ thống</Text>
                        </View>
                        <View style={styles.commandItem}>
                            <Text style={styles.cmdCode}>df -h</Text>
                            <Text style={styles.cmdDesc}>Xem dung lượng ổ cứng</Text>
                        </View>
                        <View style={styles.commandItem}>
                            <Text style={styles.cmdCode}>reboot</Text>
                            <Text style={styles.cmdDesc}>Khởi động lại VPS</Text>
                        </View>
                    </View>
                </View>

                {/* Guide Section 4: Security */}
                <View style={styles.guideSection}>
                    <Text style={styles.guideTitle}>4. BẢO MẬT VPS</Text>

                    <View style={styles.securityTips}>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>-</Text>
                            <Text style={styles.tipText}>
                                Đổi mật khẩu mặc định ngay sau khi đăng nhập lần đầu
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>-</Text>
                            <Text style={styles.tipText}>
                                Bật UFW Firewall: ufw enable, chỉ mở port cần thiết
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>-</Text>
                            <Text style={styles.tipText}>
                                Sử dụng SSH Key thay vì password
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>-</Text>
                            <Text style={styles.tipText}>
                                Cài đặt Fail2Ban để chống brute-force
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>-</Text>
                            <Text style={styles.tipText}>
                                Backup dữ liệu thường xuyên
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <Text style={styles.footerThankYou}>
                            Cảm ơn bạn đã tin tưởng dịch vụ của PCloud!
                        </Text>
                        <Text style={styles.footerContact}>
                            support@pcloud.com • Hotline: 1900 xxxx • pcloud.com
                        </Text>
                    </View>
                    <Text style={styles.footerCopyright}>
                        © {new Date().getFullYear()} PCloud Services. All rights reserved.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default VPSWelcomePDF;

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES 
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: 'Roboto',
        backgroundColor: '#ffffff',
    },
    separate: {
        color: "#5EEAD4",
    },

    // HEADER
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: '#0F172A', // Dark Slate
        padding: 30,
        paddingBottom: 25,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    brandName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    brandTagline: {
        fontSize: 10,
        color: '#5EEAD4',
        letterSpacing: 2,
        fontWeight: 'bold',
    },
    docType: {
        fontSize: 10,
        color: '#94A3B8',
        marginBottom: 4,
        letterSpacing: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#14B8A6',
    },
    pageNumber: {
        fontSize: 10,
        color: '#5EEAD4',
    },

    // WELCOME BANNER
    welcomeBanner: {
        backgroundColor: '#F0FDFA',
        borderBottomWidth: 3,
        borderBottomColor: '#14B8A6',
        padding: 20,
        paddingHorizontal: 30,
    },
    welcomeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F766E',
        marginBottom: 6,
    },
    welcomeText: {
        fontSize: 11,
        color: '#0D9488',
    },

    // SECTIONS
    section: {
        padding: 25,
        paddingBottom: 15,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        letterSpacing: 1,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#14B8A6',
        paddingLeft: 10,
    },

    // SPECS CARD
    specsCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        overflow: 'hidden',
    },
    specsHeader: {
        backgroundColor: '#0F172A',
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vpsName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    vpsDate: {
        fontSize: 9,
        color: '#94A3B8',
    },
    specsGrid: {
        flexDirection: 'row',
        padding: 15,
    },
    specItem: {
        width: '50%',
    },
    specLabel: {
        fontSize: 8,
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    specValue: {
        fontSize: 11,
        color: '#0F172A',
        fontWeight: 'bold',
    },
    techSpecs: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        padding: 12,
        justifyContent: 'space-around',
    },
    techItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    techValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F172A',
    },

    // CREDENTIALS CARD
    credentialsCard: {
        backgroundColor: '#0F172A',
        borderRadius: 8,
        padding: 20,
    },
    credentialsWarning: {
        fontSize: 9,
        color: '#F97316',
        marginBottom: 15,
    },
    credentialsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 15,
    },
    credentialBox: {
        width: '48%',
        backgroundColor: '#1E293B',
        padding: 12,
        borderRadius: 6,
    },
    credLabel: {
        fontSize: 8,
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    credValue: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    commandBox: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 6,
        padding: 12,
    },
    commandLabel: {
        fontSize: 8,
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    commandCode: {
        fontSize: 11,
        color: '#5EEAD4',
        fontWeight: 'bold',
    },

    // GUIDE SECTIONS
    guideSection: {
        padding: 25,
        paddingBottom: 15,
    },
    guideTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#14B8A6',
        paddingLeft: 10,
    },
    guideContent: {},
    guideSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F766E',
        marginTop: 10,
        marginBottom: 6,
    },
    guideText: {
        fontSize: 9,
        color: '#475569',
        marginBottom: 4,
        paddingLeft: 10,
    },
    codeBlock: {
        backgroundColor: '#0F172A',
        padding: 10,
        borderRadius: 4,
        marginVertical: 8,
        marginLeft: 10,
    },
    codeText: {
        fontSize: 9,
        color: '#5EEAD4',
        fontWeight: 'bold',
    },

    // COMMANDS GRID
    commandsGrid: {},
    commandItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 4,
    },
    cmdCode: {
        fontSize: 9,
        color: '#0D9488',
        fontWeight: 'bold',
        width: '50%',
        backgroundColor: '#E2E8F0',
        padding: 6,
        borderRadius: 4,
    },
    cmdDesc: {
        fontSize: 9,
        color: '#475569',
        paddingLeft: 12,
    },

    // SECURITY TIPS
    securityTips: {},
    tipItem: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    tipBullet: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: 'bold',
        marginRight: 8,
        marginTop: 1,
    },
    tipText: {
        fontSize: 9,
        color: '#475569',
        flex: 1,
        lineHeight: 1.4,
    },

    // FOOTER
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0F172A', // Dark Slate
        padding: 20,
        paddingHorizontal: 30,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    footerThankYou: {
        fontSize: 10,
        color: '#5EEAD4', // Teal 300
        fontWeight: 'bold',
    },
    footerContact: {
        fontSize: 8,
        color: '#94A3B8', // Slate 400
    },
    footerCopyright: {
        fontSize: 7,
        color: '#64748B', // Slate 500
        textAlign: 'center',
    },
});
