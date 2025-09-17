import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

type Locale = 'en' | 'vi';

// Type-safe locale checker
const isValidLocale = (locale: string): locale is Locale => {
    return routing.locales.includes(locale as Locale);
};

// Cache for route patterns - more scalable than hardcoded array
const ROUTE_PATTERNS = new Set([
    'login',
    'register',
    'plans',
    'support',
    'cart',
    'checkout',
    'profile',
    'my-orders',
    'admin'
]);

// Optimized locale detection with caching
const getPreferredLocale = (() => {
    const cache = new Map<string, Locale>();

    return (request: NextRequest): Locale => {
        // 1. Get locale from NEXT_LOCALE cookie
        const nextLocaleCookie = request.cookies.get('NEXT_LOCALE')?.value;
        if (nextLocaleCookie && isValidLocale(nextLocaleCookie)) {
            return nextLocaleCookie;
        }

        // 2. Fallback to Accept-Language header
        const acceptLanguage = request.headers.get('accept-language');
        if (!acceptLanguage) return 'en';

        // Check cache first
        if (cache.has(acceptLanguage)) {
            return cache.get(acceptLanguage)!;
        }

        // Parse Accept-Language header
        const languages = acceptLanguage.split(',')
            .map(lang => lang.split(';')[0].trim().split('-')[0].toLowerCase())
            .filter(lang => isValidLocale(lang));

        const result: Locale = languages.length > 0 ? languages[0] as Locale : 'en';

        // Cache the result
        cache.set(acceptLanguage, result);
        return result;
    };
})();

// Fast path checking for system routes
const isSystemRoute = (pathname: string): boolean => {
    return pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/_vercel') ||
        pathname.includes('.');
};

// Optimized route validation
const isValidAppRoute = (pathname: string): boolean => {
    // Root routes fast check
    if (pathname === '/' || pathname === '/en' || pathname === '/vi') {
        return true;
    }

    // Pattern matching for localized routes
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return false;

    // Check if first segment is locale
    const firstSegment = segments[0];
    const isLocaleFirst = isValidLocale(firstSegment);

    if (isLocaleFirst && segments.length === 1) {
        return true; // Just locale route like /en or /vi
    }

    // For routes like /en/plans or /vi/dashboard or /plans
    const routeSegment = isLocaleFirst ? segments[1] : segments[0];
    return routeSegment ? ROUTE_PATTERNS.has(routeSegment) : false;
};


export default function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Fast exit for system routes
    if (isSystemRoute(pathname)) {
        return intlMiddleware(request);
    }

    // Check if route is valid
    if (!isValidAppRoute(pathname)) {
        // Determine target locale efficiently
        const pathSegments = pathname.split('/').filter(Boolean);
        const firstSegment = pathSegments[0];
        const localeFromPath = isValidLocale(firstSegment);

        const targetLocale = localeFromPath
            ? firstSegment
            : getPreferredLocale(request);

        // Rewrite to localized not-found page while preserving URL
        return NextResponse.rewrite(new URL(`/${targetLocale}/not-found`, request.url));
    }

    // Continue with intl middleware
    return intlMiddleware(request);
}

export const config = {
    // Define a matcher that matches all paths except for:
    // 1. /api (API routes)
    // 2. /trpc (tRPC routes)
    // 3. /_next (Next.js internals)
    // 4. /_vercel (Vercel internals)
    // 5. Any path that contains a dot (e.g. /favicon.ico, /sitemap.xml)
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
}
