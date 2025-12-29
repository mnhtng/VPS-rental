'use client';

import { useTranslations } from 'next-intl';
import { Scale, Server, CreditCard, Clock, AlertTriangle, Ban, Shield, FileText, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TermsOfServicePage() {
    const t = useTranslations('terms_of_service');

    const sections = [
        {
            icon: Server,
            title: t('service_description.title'),
            items: [
                t('service_description.items.vps'),
                t('service_description.items.support'),
                t('service_description.items.uptime'),
                t('service_description.items.backup'),
            ]
        },
        {
            icon: CreditCard,
            title: t('payment_terms.title'),
            items: [
                t('payment_terms.items.billing'),
                t('payment_terms.items.methods'),
                t('payment_terms.items.refund'),
                t('payment_terms.items.late'),
            ]
        },
        {
            icon: Clock,
            title: t('sla.title'),
            items: [
                t('sla.items.uptime'),
                t('sla.items.credit'),
                t('sla.items.maintenance'),
                t('sla.items.exclusions'),
            ]
        },
        {
            icon: Ban,
            title: t('prohibited.title'),
            items: [
                t('prohibited.items.illegal'),
                t('prohibited.items.spam'),
                t('prohibited.items.malware'),
                t('prohibited.items.abuse'),
            ]
        },
        {
            icon: AlertTriangle,
            title: t('termination.title'),
            items: [
                t('termination.items.user'),
                t('termination.items.provider'),
                t('termination.items.suspension'),
                t('termination.items.data'),
            ]
        },
        {
            icon: Shield,
            title: t('liability.title'),
            items: [
                t('liability.items.limitation'),
                t('liability.items.indirect'),
                t('liability.items.force'),
                t('liability.items.third'),
            ]
        },
    ];

    return (
        <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in zoom-in-95" style={{ animationDelay: '100ms' }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-green-600 to-emerald-600 mb-6">
                        <Scale className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent py-4">
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

                {/* Important Notice */}
                <Alert className="mb-8 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        {t('notice')}
                    </AlertDescription>
                </Alert>

                {/* Introduction */}
                <Card className="mb-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
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
                            style={{ animationDelay: `${250 + index * 50}ms` }}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                                        <section.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    {section.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {section.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Changes to Terms */}
                <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '550ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            {t('changes.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t('changes.description')}
                        </p>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="mt-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '600ms' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-600">
                                <Mail className="h-5 w-5 text-white" />
                            </div>
                            {t('contact.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            {t('contact.description')}
                        </p>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                            <Mail className="h-4 w-4" />
                            <a href="mailto:legal@ptitcloud.io.vn" className="hover:underline">
                                legal@ptitcloud.io.vn
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
