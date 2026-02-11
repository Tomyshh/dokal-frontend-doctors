import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from '@/i18n/routing';
import { defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware(routing);

const LOCALE_GROUP = '(he|en|fr|ru|am|es)';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Update Supabase session (refresh token if needed)
  const { user, supabaseResponse } = await updateSession(request);

  // Route classification
  const isAuthRoute = new RegExp(`^/${LOCALE_GROUP}/(login|forgot-password|signup|verify-email)`).test(pathname);
  const isPublicRoute = new RegExp(`^/${LOCALE_GROUP}/(welcome|privacy|terms)`).test(pathname);
  const isOnboardingRoute = new RegExp(`^/${LOCALE_GROUP}/(subscription|complete-profile)`).test(pathname);
  const isDashboardRoute = new RegExp(
    `^/${LOCALE_GROUP}(/(?!login|forgot-password|signup|verify-email|welcome|privacy|terms|subscription|complete-profile).*)?$`
  ).test(pathname);

  // Protected routes: redirect unauthenticated users to welcome
  if ((isDashboardRoute || isOnboardingRoute) && !isAuthRoute && !isPublicRoute && !user) {
    const locale = pathname.split('/')[1] || defaultLocale;
    const welcomeUrl = new URL(`/${locale}/welcome`, request.url);
    return NextResponse.redirect(welcomeUrl);
  }

  // If logged in and trying to access auth or welcome, redirect to dashboard (allow privacy/terms)
  const isWelcome = new RegExp(`^/${LOCALE_GROUP}/welcome`).test(pathname);
  const isVerifyEmail = new RegExp(`^/${LOCALE_GROUP}/verify-email`).test(pathname);
  if ((isAuthRoute || isWelcome) && user && !isVerifyEmail) {
    const locale = pathname.split('/')[1] || defaultLocale;
    const dashboardUrl = new URL(`/${locale}`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Apply intl middleware and merge cookies
  const intlResponse = intlMiddleware(request);

  // Merge supabase cookies into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    });
  });

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(he|en|fr|ru|am|es)', '/(he|en|fr|ru|am|es)/:path*'],
};
