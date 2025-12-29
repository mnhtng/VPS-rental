'use client';

import { useTranslations } from 'next-intl';
import { Shield, Lock, Eye, UserCheck, Database, Mail, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
    const t = useTranslations('privacy_policy');

    const sections = [
        {
            icon: Database,
            title: t('data_collection.title'),
            items: [
                t('data_collection.items.account'),
                t('data_collection.items.payment'),
                t('data_collection.items.usage'),
                t('data_collection.items.technical'),
            ]
        },
        {
            icon: Eye,
            title: t('data_usage.title'),
            items: [
                t('data_usage.items.service'),
                t('data_usage.items.communication'),
                t('data_usage.items.improvement'),
                t('data_usage.items.security'),
            ]
        },
        {
            icon: Lock,
            title: t('data_protection.title'),
            items: [
                t('data_protection.items.encryption'),
                t('data_protection.items.access'),
                t('data_protection.items.monitoring'),
                t('data_protection.items.backup'),
            ]
        },
        {
            icon: UserCheck,
            title: t('user_rights.title'),
            items: [
                t('user_rights.items.access'),
                t('user_rights.items.correction'),
                t('user_rights.items.deletion'),
                t('user_rights.items.export'),
            ]
        },
    ];

    return (
        <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in zoom-in-95" style={{ animationDelay: '100ms' }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 mb-6">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent py-4">
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

                {/* Introduction */}
                <Card className="mb-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground leading-relaxed">
                            {t('introduction')}
                        </p>
                    </CardContent>
                </Card>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <Card
                            key={index}
                            className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-shadow"
                            style={{ animationDelay: `${200 + index * 50}ms` }}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                        <section.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {section.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Data Retention */}
                <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '400ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            {t('data_retention.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('data_retention.description')}
                        </p>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="mt-6 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '450ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-600">
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            {t('contact.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            {t('contact.description')}
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
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
