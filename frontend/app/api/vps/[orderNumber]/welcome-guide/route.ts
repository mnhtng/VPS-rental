import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import VPSWelcomePDF from '@/components/custom/pdf/VPSWelcomePDF';

// TODO: Replace với database query thực tế
async function getVPSByOrderNumber(orderNumber: string) {
    // Mock data - thay thế bằng query từ database
    return {
        customerName: "Nguyễn Văn A",
        orderNumber: orderNumber,
        orderDate: new Date().toLocaleDateString('vi-VN'),
        vps: {
            name: "VPS Pro",
            hostname: "server1.example.com",
            os: "Ubuntu 22.04 LTS",
            cpu: 4,
            ram: 8,
            storage: 100,
            bandwidth: 1000,
        },
        credentials: {
            ipAddress: "192.168.1.100",
            username: "root",
            password: "YourSecurePassword123",
            sshPort: 22,
        },
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

        // Lấy thông tin VPS từ database
        const vpsData = await getVPSByOrderNumber(orderNumber);

        if (!vpsData) {
            return NextResponse.json(
                { error: 'VPS not found' },
                { status: 404 }
            );
        }

        // TODO: Kiểm tra quyền truy cập
        // const session = await auth();
        // if (!session) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Render PDF thành Buffer
        const pdfBuffer = await renderToBuffer(
            VPSWelcomePDF({
                customerName: vpsData.customerName,
                orderNumber: vpsData.orderNumber,
                orderDate: vpsData.orderDate,
                vps: vpsData.vps,
                credentials: vpsData.credentials,
            })
        );

        // Trả về PDF
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="VPS-Guide-${orderNumber}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error generating VPS welcome PDF:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 }
        );
    }
}
