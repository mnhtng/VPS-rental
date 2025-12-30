import { generateDynamicPageMetadata } from '@/utils/page-metadata';
import { Metadata } from 'next';

interface PlanData {
    id: string;
    name: string;
    vcpu: number;
    ram_gb: number;
    storage_gb: number;
    storage_type: string;
    bandwidth_tb: number;
    price_monthly: number;
}

async function getPlanData(planId: string): Promise<PlanData | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/${planId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'force-cache',
            next: { revalidate: 3600 } // Revalidate mỗi 1 giờ
        });

        if (!res.ok) return null;
        const result = await res.json();
        return result?.data || null;
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
    const plan = await getPlanData(id);

    return generateDynamicPageMetadata({
        locale,
        page: 'plan_item',
        path: `/plans/${id}`,
        data: plan ? {
            name: plan.name,
            vcpu: plan.vcpu,
            ram: plan.ram_gb,
            storage: plan.storage_gb,
            storage_type: plan.storage_type,
            bandwidth: plan.bandwidth_tb,
            price: plan.price_monthly,
        } : null,
        robots: true,
    });
}

export default function PlanItemLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}