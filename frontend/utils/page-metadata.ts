import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const defaultUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

/**
 * Generate metadata for static pages
 */
export async function generatePageMetadata({
    locale,
    page,
    path = '',
    robots = false,
    twitterCard = 'summary_large_image',
    image = "/logo.png",

}: {
    locale: string;
    page: string;
    path?: string;
    robots?: boolean;
    twitterCard?: 'summary' | 'summary_large_image';
    image?: string;
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: `metadata.${page}` });

    const title = t('title');
    const description = t('description');
    const keywords = t('keywords');
    const url = `${defaultUrl}/${locale}${path}`;

    return {
        metadataBase: new URL(defaultUrl),
        title,
        description,
        keywords,
        openGraph: {
            title,
            description,
            url,
            siteName: 'PCloud',
            locale: locale === 'vi' ? 'vi_VN' : 'en_US',
            type: 'website',
        },
        twitter: {
            card: twitterCard,
            title,
            description,
        },
        alternates: {
            canonical: url,
            languages: {
                'en': `${defaultUrl}/en${path}`,
                'vi': `${defaultUrl}/vi${path}`,
            },
        },
        robots: {
            index: robots,
            follow: robots,
        },
        icons: {
            icon: image,
            shortcut: image,
            apple: image,
        },
    };
}

/**
 * Generate metadata for dynamic pages with data fetching
 */
export async function generateDynamicPageMetadata({
    locale,
    page,
    path = '',
    data = null,
    robots = false,
    twitterCard = 'summary_large_image',
    image = "/logo.png",
}: {
    locale: string;
    page: string;
    path?: string;
    data?: Record<string, string | number> | null;
    robots?: boolean;
    twitterCard?: 'summary' | 'summary_large_image';
    image?: string;
}): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: `metadata.${page}` });
    const url = `${defaultUrl}/${locale}${path}`;

    if (!data) {
        return {
            metadataBase: new URL(defaultUrl),
            title: t('title_fallback'),
            description: t('description_fallback'),
            robots: {
                index: robots,
                follow: robots,
            },
            icons: {
                icon: image,
                shortcut: image,
                apple: image,
            },
        };
    }

    const title = t('title', data);
    const description = t('description', data);

    return {
        metadataBase: new URL(defaultUrl),
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: 'PCloud',
            locale: locale === 'vi' ? 'vi_VN' : 'en_US',
            type: 'website',
        },
        twitter: {
            card: twitterCard,
            title,
            description,
        },
        alternates: {
            canonical: url,
            languages: {
                'en': `${defaultUrl}/en${path}`,
                'vi': `${defaultUrl}/vi${path}`,
            },
        },
        robots: {
            index: robots,
            follow: robots,
        },
        icons: {
            icon: image,
            shortcut: image,
            apple: image,
        },
    };
}