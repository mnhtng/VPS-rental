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
        page: 'renewal',
        path: '/client-dashboard/billing/renewal'
    });
}

export default function RenewalLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}