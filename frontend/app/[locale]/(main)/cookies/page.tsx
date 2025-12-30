'use client';

import { useTranslations } from 'next-intl';
import { Cookie, Settings, BarChart3, Shield, Clock, Mail, ToggleLeft, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CookiePolicyPage() {
    const t = useTranslations('cookies_policy');

    const cookieTypes = [
        {
            icon: Shield,
            title: t('essential.title'),
            badge: t('essential.badge'),
            badgeVariant: 'default' as const,
            description: t('essential.description'),
            examples: [
                t('essential.examples.session'),
                t('essential.examples.auth'),
                t('essential.examples.security'),
            ]
        },
        {
            icon: BarChart3,
            title: t('analytics.title'),
            badge: t('analytics.badge'),
            badgeVariant: 'secondary' as const,
            description: t('analytics.description'),
            examples: [
                t('analytics.examples.usage'),
                t('analytics.examples.performance'),
                t('analytics.examples.errors'),
            ]
        },
        {
            icon: Settings,
            title: t('preferences.title'),
            badge: t('preferences.badge'),
            badgeVariant: 'outline' as const,
            description: t('preferences.description'),
            examples: [
                t('preferences.examples.language'),
                t('preferences.examples.theme'),
                t('preferences.examples.settings'),
            ]
        },
    ];

    return (
        <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in zoom-in-95" style={{ animationDelay: '100ms' }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-purple-600 to-pink-600 mb-6">
                        <Cookie className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent py-4">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{t('last_updated')}: 28/12/2025</span>
                    </div>
                </div>

                {/* What are cookies */}
                <Card className="mb-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                                <Info className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            {t('what_are_cookies.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('what_are_cookies.description')}
                        </p>
                    </CardContent>
                </Card>

                {/* Cookie Types */}
                <div className="space-y-6">
                    {cookieTypes.map((cookieType, index) => (
                        <Card
                            key={index}
                            className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-shadow"
                            style={{ animationDelay: `${200 + index * 50}ms` }}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                                            <cookieType.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        {cookieType.title}
                                    </CardTitle>
                                    <Badge variant={cookieType.badgeVariant}>
                                        {cookieType.badge}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    {cookieType.description}
                                </p>
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium mb-2">{t('examples')}:</h4>
                                    <ul className="space-y-2">
                                        {cookieType.examples.map((example, exIndex) => (
                                            <li key={exIndex} className="flex items-start gap-3 text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                                                <span className="text-muted-foreground">{example}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Managing Cookies */}
                <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '350ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                                <ToggleLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            {t('managing.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            {t('managing.description')}
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                                <span className="text-muted-foreground">{t('managing.items.browser')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                                <span className="text-muted-foreground">{t('managing.items.disable')}</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 shrink-0" />
                                <span className="text-muted-foreground">{t('managing.items.delete')}</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="mt-6 bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '400ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-600">
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            {t('contact.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            {t('contact.description')}
                        </p>
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                            <Mail className="h-4 w-4" />
                            <a href="mailto:privacy@ptitcloud.io.vn" className="hover:underline">
                                privacy@ptitcloud.io.vn
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
