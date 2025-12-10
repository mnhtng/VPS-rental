import { generatePageMetadata } from '@/utils/page-metadata';
import { Metadata } from 'next';

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    return generatePageMetadata({
        locale,
        page: 'vnpay-return',
        path: '/checkout/vnpay-return'
    });
}

export default function VnpayReturnLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}