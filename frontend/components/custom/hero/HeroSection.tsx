'use client';

import { useTheme } from 'next-themes';
import BackgroundMeteors from '@/components/ui/backgroundmeteors';
import HeroContent from '@/components/custom/hero/HeroContent';
import VPSControlPanel from '@/components/custom/hero/Visual';
import { useEffect, useState } from 'react';

export default function HeroSection({
    locale,
    t
}: {
    locale: string;
    t: (key: string) => string;
}) {
    const localTheme = localStorage?.getItem('theme') === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : (localStorage?.getItem('theme') || 'light');

    const { resolvedTheme } = useTheme();
    const [theme, setTheme] = useState(localTheme);

    useEffect(() => {
        setTheme(resolvedTheme || 'light');
    }, [resolvedTheme]);

    const ContentLayout = () => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center z-1">
            <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <HeroContent isDark={theme === 'dark'} locale={locale} t={t} />

                <div className="relative hidden lg:block">
                    <VPSControlPanel isDark={theme === 'dark'} t={t} />
                </div>
            </div>
        </div>
    );

    return theme === 'dark' ? (
        <BackgroundMeteors>
            <ContentLayout />
        </BackgroundMeteors>
    ) : (
        <div className="relative md:min-h-[calc(100vh-4rem)] w-full bg-white flex items-center justify-center py-10">
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
                        radial-gradient(circle 800px at 100% 200px, #d5c5ff, transparent)
                    `,
                    backgroundSize: "96px 64px, 96px 64px, 100% 100%",
                }}
            />
            <ContentLayout />
        </div>
    );
}
