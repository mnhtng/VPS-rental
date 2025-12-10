import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/custom/pdf/InvoicePDF';

// TODO: Thay thế bằng database query thực tế
async function getOrderByNumber(orderNumber: string) {
    // Mock data - thay thế bằng query từ database
    // Ví dụ: return await prisma.order.findUnique({ where: { orderNumber } });

    // Ví dụ mock data để test
    return {
        customerName: "Nguyễn Văn A",
        customerEmail: "customer@example.com",
        customerPhone: "0123456789",
        customerAddress: "123 Đường ABC, TP.HCM",
        orderNumber: orderNumber,
        orderDate: new Date().toLocaleDateString('vi-VN'),
        vpsItems: [
            {
                name: "VPS Pro",
                hostname: "server1.example.com",
                os: "Ubuntu 22.04",
                duration_months: 12,
                cpu: 4,
                ram: 8,
                storage: 100,
                bandwidth: 1000,
                ip_addresses: 1,
                price: 200000,
                total_price: 2400000
            }
        ],
        subtotal: 2400000,
        discount: 0,
        total: 2400000,
        paymentMethod: "MoMo",
        transactionId: "TXN123456"
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderNumber: string }> }
) {
    try {
        const { orderNumber } = await params;

        if (!orderNumber) {
            return NextResponse.json(
                { error: 'Order number is required' },
                { status: 400 }
            );
        }

        // Lấy thông tin đơn hàng từ database
        const order = await getOrderByNumber(orderNumber);

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // TODO: Kiểm tra quyền truy cập - đảm bảo user hiện tại có quyền xem đơn hàng này
        // const session = await auth();
        // if (!session || session.user.email !== order.customerEmail) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Render PDF thành Buffer
        const pdfBuffer = await renderToBuffer(
            InvoicePDF({
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                customerAddress: order.customerAddress,
                orderNumber: order.orderNumber,
                orderDate: order.orderDate,
                vpsItems: order.vpsItems,
                subtotal: order.subtotal,
                discount: order.discount,
                total: order.total,
                paymentMethod: order.paymentMethod,
                transactionId: order.transactionId,
            })
        );

        // Trả về PDF với headers phù hợp để browser download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoice-${orderNumber}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice' },
            { status: 500 }
        );
    }
}
