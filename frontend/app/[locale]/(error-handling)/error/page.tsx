"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Home, LogIn, RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react"
import { useLocale } from "next-intl"
import { useTranslations } from "use-intl"
// import { useSession } from "next-auth/react"

export default function Error({
    statusCode = 500
}: {
    statusCode?: number
}) {
    // const { data: session } = useSession()

    const locale = useLocale()
    const t = useTranslations('errors')

    if (statusCode && statusCode === 401) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/50 dark:via-gray-900 dark:to-orange-950/50 flex items-center justify-center p-4">
                <Card className="max-w-2xl mx-auto shadow-2xl border-0 dark:bg-gray-800/50 dark:border-gray-700">
                    <CardContent className="p-4 sm:p-8 md:p-12 text-center space-y-6 md:space-y-8">
                        <div className="relative z-1">
                            <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 leading-none">
                                401
                            </h1>
                            <div className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl font-bold text-red-100 dark:text-red-900/60 -z-1 translate-x-2 translate-y-2">
                                401
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                                {t('unauthorized.title')}
                            </h2>

                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                                {t('unauthorized.subtitle')}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50 rounded-full flex items-center justify-center">
                                    <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 dark:text-red-400" />
                                </div>

                                <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center">
                                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                asChild
                                size="lg"
                                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 w-full sm:w-auto"
                            >
                                {/* <Link href={`${session ? ("/" + locale) : "/" + locale + "/login"}`}>
                                    {session ? <Home className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" /> }
                                    {session ? t('unauthorized.backHome') : t('unauthorized.login')}
                                </Link> */}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => window.history.back()}
                                className="w-full sm:w-auto dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('unauthorized.goBack')}
                            </Button>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                                    {t('unauthorized.whyTitle')}
                                </h3>
                                <ul className="text-sm text-red-700 dark:text-red-200 space-y-1 text-left">
                                    {t.raw('unauthorized.reasons').map((reason: string, index: number) => (
                                        <li key={index}>• {reason}</li>
                                    ))}
                                </ul>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('unauthorized.needHelp')}{' '}
                                <Link href={`/${locale}/support`} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline">
                                    {t('unauthorized.contactUs')}
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/50 dark:via-gray-900 dark:to-orange-950/50 flex items-center justify-center p-4">
            <Card className="max-w-2xl mx-auto shadow-2xl border-0 dark:bg-gray-800/50 dark:border-gray-700">
                <CardContent className="p-4 sm:p-8 md:p-12 text-center space-y-6 md:space-y-8">
                    <div className="relative z-1">
                        <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 leading-none">
                            500
                        </h1>
                        <div className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl font-bold text-red-100 dark:text-red-900/60 -z-1 translate-x-2 translate-y-2">
                            500
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                            {t('serverError.title')}
                        </h2>

                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            {t('serverError.subtitle')}
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 dark:text-red-400" />
                            </div>

                            <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            asChild
                            size="lg"
                            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 w-full sm:w-auto"
                        >
                            <Link
                                href={`/${locale}`}
                                className="text-accent-foreground hover:text-white"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                {t('serverError.backHome')}
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.location.reload()}
                            className="w-full sm:w-auto dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('serverError.tryAgain')}
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                                {t('serverError.whyTitle')}
                            </h3>
                            <ul className="text-sm text-red-700 dark:text-red-200 space-y-1 text-left">
                                {t.raw('serverError.reasons').map((reason: string, index: number) => (
                                    <li key={index}>• {reason}</li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('serverError.needHelp')}{' '}
                            <Link href={`/${locale}/support`} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline">
                                {t('serverError.contactUs')}
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}