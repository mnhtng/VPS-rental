import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import BProgressProviders from "@/contexts/ProgressbarContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OAuthSyncProvider } from "@/contexts/OAuthContext";
import { Toaster } from "sonner";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from 'next/navigation';
import ClickSpark from "@/components/ClickSpark";

import "@/styles/globals.css";
import "@/styles/styles.css";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

const defaultUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
});

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    const t = await getTranslations({ locale, namespace: 'metadata.home' });

    return {
        metadataBase: new URL(defaultUrl),
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        icons: {
            icon: "/logo.png",
            shortcut: "/logo.png",
            apple: "/logo.png",
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `${defaultUrl}/${locale}`,
            siteName: 'PCloud',
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
        },
        alternates: {
            canonical: `${defaultUrl}/${locale}`,
            languages: {
                'en': `${defaultUrl}/en`,
                'vi': `${defaultUrl}/vi`,
            },
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default async function RootLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    // Ensure that the incoming `locale` is valid
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    return (
        <html lang={locale} className={inter.className} suppressHydrationWarning>
            <body className="bg-background text-foreground">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                    enableColorScheme
                >
                    <SessionProvider>
                        <OAuthSyncProvider>
                            <AuthProvider>
                                <CartProvider>
                                    <BProgressProviders>
                                        <NextIntlClientProvider>
                                            <>
                                                <ClickSpark
                                                    sparkColor="#69fc74"
                                                    sparkSize={10}
                                                    sparkRadius={15}
                                                    sparkCount={8}
                                                    duration={400}
                                                >
                                                    {children}
                                                </ClickSpark>
                                            </>

                                            <Toaster
                                                richColors
                                                closeButton
                                                position="top-right"
                                                expand={false}
                                                duration={5000}
                                            />
                                        </NextIntlClientProvider>
                                    </BProgressProviders>
                                </CartProvider>
                            </AuthProvider>
                        </OAuthSyncProvider>
                    </SessionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
