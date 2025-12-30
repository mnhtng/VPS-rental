"use client"

import { useLocale, useTranslations } from 'next-intl';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
    const locale = useLocale();
    const t = useTranslations('errors.notFound');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/50 dark:via-gray-900 dark:to-purple-950/50 flex items-center justify-center p-4">
            <Card className="max-w-2xl mx-auto shadow-2xl border-0 dark:bg-gray-800/50 dark:border-gray-700">
                <CardContent className="p-4 sm:p-8 md:p-12 text-center space-y-6 md:space-y-8">
                    {/* Large 404 Text */}
                    <div className="relative z-1">
                        <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 leading-none">
                            404
                        </h1>
                        <div className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl font-bold text-blue-100 dark:text-blue-900/60 -z-1 translate-x-2 translate-y-2">
                            404
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="space-y-4">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                            {t('title')}
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Illustration */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            asChild
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 w-full sm:w-auto"
                        >
                            <Link href={`/${locale}`}>
                                <Home className="w-4 h-4 mr-2" />
                                {t('backHome')}
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('goBack')}
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                {t('whyTitle')}
                            </h3>
                            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1 text-left">
                                {t.raw('reasons').map((reason: string, index: number) => (
                                    <li key={index}>• {reason}</li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('needHelp')}{" "}
                            <Link href={`/${locale}/support`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                                {t('contactUs')}
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}