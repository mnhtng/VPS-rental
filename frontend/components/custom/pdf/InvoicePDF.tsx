import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';
import { formatPrice } from '@/utils/currency';
import { InvoicePDFProps } from '@/types/types';

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

const InvoicePDF = ({
    customerName = "Khách hàng",
    customerEmail = "customer@example.com",
    customerPhone = "",
    customerAddress = "",
    orderNumber = "VPS-1234567890",
    orderDate = new Date().toLocaleDateString('vi-VN'),
    vpsItems = [],
    subtotal = 0,
    discount = 0,
    total = 0,
    paymentMethod = "MoMo",
    transactionId = "N/A",
}: InvoicePDFProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* ══════════════════════════════════════════════════════════════════
                    HEADER - Dark Slate with Teal accent
                ══════════════════════════════════════════════════════════════════ */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.brandName}>PCloud</Text>
                        <Text style={styles.brandTagline}>PREMIUM VPS HOSTING</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceLabel}>HÓA ĐƠN ĐIỆN TỬ</Text>
                        <Text style={styles.invoiceNumber}>#{orderNumber}</Text>
                    </View>
                </View>

                {/* ══════════════════════════════════════════════════════════════════
                    ORDER META - Quick info bar
                ══════════════════════════════════════════════════════════════════ */}
                <View style={styles.metaBar}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>NGÀY ĐẶT</Text>
                        <Text style={styles.metaValue}>{orderDate}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>THANH TOÁN</Text>
                        <Text style={styles.metaValue}>{paymentMethod}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>MÃ GIAO DỊCH</Text>
                        <Text style={styles.metaValue}>{transactionId || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaItemStatus}>
                        <Text style={styles.statusBadge}>ĐÃ THANH TOÁN</Text>
                    </View>
                </View>

                {/* ══════════════════════════════════════════════════════════════════
                    CUSTOMER INFO - Left aligned card
                ══════════════════════════════════════════════════════════════════ */}
                <View style={styles.customerCard}>
                    <Text style={styles.sectionTitle}>THÔNG TIN KHÁCH HÀNG</Text>
                    <View style={styles.customerGrid}>
                        <View style={styles.customerRow}>
                            <Text style={styles.customerLabel}>Họ tên:</Text>
                            <Text style={styles.customerValue}>{customerName}</Text>
                        </View>
                        <View style={styles.customerRow}>
                            <Text style={styles.customerLabel}>Email:</Text>
                            <Text style={styles.customerValue}>{customerEmail}</Text>
                        </View>
                        {customerPhone && (
                            <View style={styles.customerRow}>
                                <Text style={styles.customerLabel}>Điện thoại:</Text>
                                <Text style={styles.customerValue}>{customerPhone}</Text>
                            </View>
                        )}
                        {customerAddress && (
                            <View style={styles.customerRow}>
                                <Text style={styles.customerLabel}>Địa chỉ:</Text>
                                <Text style={styles.customerValue}>{customerAddress}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ══════════════════════════════════════════════════════════════════
                    VPS ITEMS - Modern table
                ══════════════════════════════════════════════════════════════════ */}
                <View style={styles.tableSection}>
                    <Text style={styles.sectionTitle}>CHI TIẾT DỊCH VỤ VPS</Text>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.thCell, { width: '35%' }]}>DỊCH VỤ</Text>
                        <Text style={[styles.thCell, { width: '30%' }]}>CẤU HÌNH</Text>
                        <Text style={[styles.thCell, { width: '15%', textAlign: 'center' }]}>THỜI HẠN</Text>
                        <Text style={[styles.thCell, { width: '20%', textAlign: 'right' }]}>THÀNH TIỀN</Text>
                    </View>

                    {/* Table Body */}
                    {vpsItems.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tdCell, { width: '35%' }]}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemMeta}>Hostname: {item.hostname}</Text>
                                <Text style={styles.itemMeta}>OS: {item.os}</Text>
                            </View>
                            <View style={[styles.tdCell, { width: '30%' }]}>
                                <View style={styles.specsGrid}>
                                    <Text style={styles.specItem}>{item.cpu} vCPU</Text>
                                    <Text style={styles.specItem}>{item.ram} GB RAM</Text>
                                    <Text style={styles.specItem}>{item.storage} GB SSD</Text>
                                    <Text style={styles.specItem}>{item.network_speed < 1000 ? item.network_speed : Math.round(item.network_speed / 1000).toFixed(1)} {item.network_speed < 1000 ? 'Mbps' : 'Gbps'}</Text>
                                </View>
                            </View>
                            <View style={[styles.tdCell, { width: '15%', alignItems: 'center' }]}>
                                <Text style={styles.durationBadge}>{item.duration_months} tháng</Text>
                            </View>
                            <View style={[styles.tdCell, { width: '20%', alignItems: 'flex-end' }]}>
                                <Text style={styles.itemPrice}>{formatPrice(item.total_price || 0)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ══════════════════════════════════════════════════════════════════
                    SUMMARY SECTION - Split layout
                ══════════════════════════════════════════════════════════════════ */}
                <View style={styles.summarySection}>
                    {/* Notes Card */}
                    <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>GHI CHÚ</Text>
                        <Text style={styles.noteItem}>• VPS kích hoạt trong 5-10 phút</Text>
                        <Text style={styles.noteItem}>• Thông tin đăng nhập gửi qua email</Text>
                        <Text style={styles.noteItem}>• Liên hệ support nếu cần hỗ trợ</Text>
                    </View>

                    {/* Totals Card */}
                    <View style={styles.totalsCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tạm tính:</Text>
                            <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
                        </View>
                        {discount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Giảm giá:</Text>
                                <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
                            </View>
                        )}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Phí thiết lập:</Text>
                            <Text style={styles.freeValue}>MIỄN PHÍ</Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalRowFinal}>
                            <Text style={styles.grandTotalLabel}>TỔNG CỘNG</Text>
                            <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* ══════════════════════════════════════════════════════════════════
                    FOOTER
                ══════════════════════════════════════════════════════════════════ */}
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
                        © {new Date().getFullYear()} PCloud Services. Hóa đơn điện tử có giá trị pháp lý.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePDF;

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
        color: '#5EEAD4', // Teal 300
        letterSpacing: 2,
        fontWeight: 'bold',
    },
    invoiceLabel: {
        fontSize: 10,
        color: '#94A3B8', // Slate 400
        marginBottom: 4,
        letterSpacing: 1,
    },
    invoiceNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#14B8A6', // Teal 500
    },

    // META BAR
    metaBar: {
        flexDirection: 'row',
        backgroundColor: '#F0FDFA', // Teal 50
        borderBottomWidth: 3,
        borderBottomColor: '#14B8A6', // Teal 500
        paddingVertical: 12,
        paddingHorizontal: 30,
    },
    metaItem: {
        flex: 1,
    },
    metaLabel: {
        fontSize: 8,
        color: '#64748B', // Slate 500
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 10,
        color: '#0F172A',
        fontWeight: 'bold',
    },
    metaItemStatus: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    statusBadge: {
        fontSize: 9,
        color: '#ffffff',
        backgroundColor: '#10B981', // Emerald 500
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 4,
        fontWeight: 'bold',
    },

    // CUSTOMER CARD
    customerCard: {
        margin: 30,
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#F8FAFC', // Slate 50
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#14B8A6', // Teal 500
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F172A',
        letterSpacing: 1,
        marginBottom: 12,
    },
    customerGrid: {
        flexDirection: 'column',
    },
    customerRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    customerLabel: {
        fontSize: 9,
        color: '#64748B',
        width: 70,
    },
    customerValue: {
        fontSize: 9,
        color: '#0F172A',
        fontWeight: 'bold',
        flex: 1,
    },

    // TABLE SECTION
    tableSection: {
        marginHorizontal: 30,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0F172A', // Dark Slate
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 4,
    },
    thCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#5EEAD4', // Teal 300
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#ffffff',
    },
    tdCell: {
        fontSize: 9,
    },
    itemName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 8,
        color: '#64748B',
        marginBottom: 2,
    },
    specsGrid: {
        flexDirection: 'column',
    },
    specItem: {
        fontSize: 8,
        color: '#475569',
        marginBottom: 2,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#14B8A6', // Teal
    },
    durationBadge: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0F766E', // Teal 700
        backgroundColor: '#CCFBF1', // Teal 100
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    itemPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#F97316', // Orange 500
    },

    // SUMMARY SECTION
    summarySection: {
        flexDirection: 'row',
        marginHorizontal: 30,
        marginBottom: 20,
        gap: 15,
    },
    notesCard: {
        flex: 1,
        backgroundColor: '#FFF7ED', // Orange 50
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDBA74', // Orange 300
    },
    notesTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#C2410C', // Orange 700
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    noteItem: {
        fontSize: 8,
        color: '#9A3412', // Orange 800
        marginBottom: 4,
        lineHeight: 1.4,
    },
    totalsCard: {
        width: '45%',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 10,
        color: '#64748B',
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    discountValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10B981', // Emerald
    },
    freeValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10B981', // Emerald
    },
    totalDivider: {
        borderBottomWidth: 2,
        borderBottomColor: '#0F172A',
        marginVertical: 10,
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F97316', // Orange
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
