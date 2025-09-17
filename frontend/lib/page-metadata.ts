import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

/**
 * Generate metadata for individual pages
 */
export async function generatePageMetadata({
    locale,
    page,
    path = ''
}: {
    locale: string;
    page: string;
    path?: string;
}): Promise<Metadata> {
    const pageT = await getTranslations({ locale, namespace: `pages.${page}` });

    const title = pageT('title');
    const description = pageT('description');
    const keywords = pageT('keywords');
    const url = `${defaultUrl}/${locale}${path}`;

    return {
        metadataBase: new URL(defaultUrl),
        title: title,
        description: description,
        keywords: keywords,
        openGraph: {
            title: title,
            description: description,
            url: url,
            siteName: 'VStack',
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
        },
        alternates: {
            canonical: url,
            languages: {
                'en': `${defaultUrl}/en${path}`,
                'vi': `${defaultUrl}/vi${path}`,
            },
        },
        robots: {
            index: true,
            follow: true,
        },
        icons: {
            icon: "/logo.ico",
            shortcut: "/logo.ico",
            apple: "/logo.ico",
        },
    };
}