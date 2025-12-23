import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerLocale, SupportedLocale, isValidLocale } from '@/utils/locale';

const intlMiddleware = createMiddleware(routing);

// Interface for request objects that can handle both NextRequest and auth-enhanced request
interface RequestWithHeaders {
    cookies: { get: (name: string) => { value: string } | undefined };
    headers: { get: (name: string) => string | null };
}

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
    'my-tickets',
    'admin',
    'error',
    'not-found',
    'pending-verification',
    'verify-email',
    'forgot-password',
    'reset-password',
    'client-dashboard',
]);

// Protected routes that require authentication
const PROTECTED_ROUTES = new Set([
    'profile',
    'my-orders',
    'my-tickets',
    'cart',
    'checkout',
    'admin',
    'client-dashboard',
]);

/**
 * Helper function to get locale from NextRequest using our centralized utility
 * This replaces the previous complex caching logic with a unified approach
 * Priority: cookies (NEXT_LOCALE > locale) > pathname > Accept-Language > default
 */
const getPreferredLocale = (request: RequestWithHeaders, pathname?: string): SupportedLocale => {
    // Get all cookies and convert to string format for getServerLocale
    const nextLocaleCookie = request.cookies.get('NEXT_LOCALE')?.value;
    const localeCookie = request.cookies.get('locale')?.value;

    const cookieString = [
        nextLocaleCookie ? `NEXT_LOCALE=${nextLocaleCookie}` : null,
        localeCookie ? `locale=${localeCookie}` : null
    ].filter(Boolean).join('; ') || undefined;

    const acceptLanguage = request.headers.get('accept-language');

    return getServerLocale(cookieString, acceptLanguage, pathname);
};

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


// Check if a route is protected
const isProtectedRoute = (pathname: string): boolean => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return false;

    // Check if first segment is locale
    const firstSegment = segments[0];
    const isLocaleFirst = isValidLocale(firstSegment);

    // For routes like /en/profile or /vi/admin or /profile
    const routeSegment = isLocaleFirst ? segments[1] : segments[0];
    return routeSegment ? PROTECTED_ROUTES.has(routeSegment) : false;
};

const isAuthRoute = (pathname: string): boolean => {
    // Middleware bypass cho auth routes: Middleware không chặn các request đến /api/auth/* để NextAuth có thể xử lý callback
    return pathname.startsWith('/api/auth');
}

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Fast exit for system routes
    if (isSystemRoute(pathname) || isAuthRoute(pathname)) {
        return intlMiddleware(request);
    }

    // Check authentication for protected routes
    if (isProtectedRoute(pathname)) {
        // Get JWT token instead of using auth() wrapper to avoid bcrypt in Edge Runtime
        const token = await getToken({
            req: request,
            secret: process.env.AUTH_SECRET,
            cookieName: 'pcloud-auth.session-token'
        });

        if (!token) {
            // User is not authenticated, redirect to login
            const locale = getPreferredLocale(request, pathname);

            const loginUrl = new URL(`/${locale}/login`, request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Check if route is valid
    if (!isValidAppRoute(pathname)) {
        // Determine target locale efficiently using our enhanced function
        const targetLocale = getPreferredLocale(request, pathname);

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
