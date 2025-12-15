import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { generateDynamicPageMetadata } from '@/utils/page-metadata';

interface VPSInfo {
    hostname: string;
    os: string;
    vcpu: number;
    ram_gb: number;
    storage_gb: number;
    storage_type: string;
    power_status: string;
    ip_address?: string;
}

async function getAccessTokenFromRefresh(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('pcloud_refresh_token')?.value;

        if (!refreshToken) return null;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const result = await res.json();
        return result?.data?.access_token || null;
    } catch {
        return null;
    }
}

async function getVPSData(vpsId: string): Promise<VPSInfo | null> {
    try {
        const accessToken = await getAccessTokenFromRefresh();

        if (!accessToken) return null;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/info`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
    const { locale, id } = await params;
    const vpsData = await getVPSData(id);

    return generateDynamicPageMetadata({
        locale,
        page: 'vps_detail',
        path: `/client-dashboard/vps/${id}`,
        data: vpsData ? {
            hostname: vpsData.hostname,
            vcpu: vpsData.vcpu,
            ram: vpsData.ram_gb,
            storage: vpsData.storage_gb,
            storage_type: vpsData.storage_type,
            os: vpsData.os,
        } : null,
        robots: false,
    });
}

export default function VPSItemLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}
