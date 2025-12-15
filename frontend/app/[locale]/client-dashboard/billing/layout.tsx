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
    page: 'billing',
    path: '/client-dashboard/billing'
  });
}

export default function BillingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
