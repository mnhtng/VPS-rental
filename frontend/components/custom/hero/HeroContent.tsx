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
        <div className="text-left">
            <div className="mb-6">
                <Badge className={`mb-4 ${styles.badge}`}>
                    <Star className="w-4 h-4 mr-2" />
                    {t('hero.badge')}
                </Badge>
            </div>

            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold ${styles.title} mb-6 leading-tight`}>
                {t('hero.title')}
            </h1>

            <p className={`text-xl md:text-2xl ${styles.subtitle} mb-8 leading-relaxed`}>
                {t('hero.subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center">
                        <CheckCircle className={`h-5 w-5 ${styles.checkIcon} mr-3 flex-shrink-0`} />
                        <span className={styles.feature}>{feature}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className={`text-lg px-8 py-4 ${styles.primaryBtn}`} asChild>
                    <Link href={`/${locale}/plans`}>
                        {t('hero.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
                <Button variant="outline" size="lg" className={`text-lg px-8 py-4 ${styles.outlineBtn}`} asChild>
                    <Link href={`/${locale}/support`}>
                        {t('hero.learn_more')}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
