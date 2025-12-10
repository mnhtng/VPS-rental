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
        page: 'momo-return',
        path: '/checkout/momo-return'
    });
}

export default function MomoReturnLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}