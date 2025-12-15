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
    page: 'settings',
    path: '/client-dashboard/settings'
  });
}

export default function SettingsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
