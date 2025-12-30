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
        page: 'register',
        path: '/register',
        robots: true
    });
}

export default function RegisterLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}