'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Star } from 'lucide-react';

export default function HeroContent({
    isDark = false,
    locale,
    t
}: {
    isDark?: boolean;
    locale: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, options?: any) => string;
}) {
    const features = [];
    for (let i = 0; i < 4; i++)
        features.push(t(`hero.features.${i}`));

    const styles = isDark ? {
        badge: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
        title: 'bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
        subtitle: 'text-gray-300',
        feature: 'text-gray-300',
        checkIcon: 'text-green-400',
        primaryBtn: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all',
        outlineBtn: 'border-2',
        avatarBorder: 'border-gray-800'
    } : {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        title: 'text-primary',
        subtitle: 'text-muted-foreground',
        feature: 'text-gray-700',
        checkIcon: 'text-green-500',
        primaryBtn: 'shadow-lg hover:shadow-xl transition-shadow',
        outlineBtn: 'border-2 hover:bg-gray-50',
        avatarBorder: 'border-white'
    };

    return (
        <div className="text-left space-y-6">
            <div className="mb-6 animate-in fade-in slide-in-from-left duration-700">
                <Badge className={`mb-4 ${styles.badge} hover:scale-105 transition-transform duration-200`}>
                    <Star className="w-4 h-4 mr-2 animate-pulse" />
                    {t('hero.badge')}
                </Badge>
            </div>

            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold ${styles.title} mb-6 leading-tight animate-in fade-in slide-in-from-left duration-1000`}>
                {t('hero.title')}
            </h1>

            <p className={`text-xl md:text-2xl ${styles.subtitle} mb-8 leading-relaxed animate-in fade-in slide-in-from-left duration-1000 delay-150`}>
                {t('hero.subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature: string, index: number) => (
                    <div
                        key={index}
                        className="flex items-center group hover:translate-x-2 transition-all duration-300 animate-in fade-in slide-in-from-left"
                        style={{
                            animationDelay: `${300 + index * 100}ms`,
                            animationDuration: '700ms'
                        }}
                    >
                        <CheckCircle className={`h-5 w-5 ${styles.checkIcon} mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200`} />
                        <span className={styles.feature}>{feature}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left duration-1000 delay-300">
                <Button
                    size="lg"
                    className={`text-lg px-8 py-4 ${styles.primaryBtn} group hover:scale-105 transition-all duration-300`}
                    asChild
                >
                    <Link href={`/${locale}/plans`} className="flex items-center">
                        {t('hero.cta')}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className={`text-lg px-8 py-4 ${styles.outlineBtn} hover:scale-105 transition-all duration-300`}
                    asChild
                >
                    <Link href={`/${locale}/support`}>
                        {t('hero.learn_more')}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
