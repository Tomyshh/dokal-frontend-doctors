import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

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

  // Check if it's a protected route (dashboard routes)
  const isAuthRoute = /^\/(fr|en|he|ru)\/(login|forgot-password|signup)/.test(pathname);
  const isPublicRoute = /^\/(fr|en|he|ru)\/(welcome|privacy|terms)/.test(pathname);
  const isDashboardRoute = /^\/(fr|en|he|ru)(\/(?!login|forgot-password|signup|welcome|privacy|terms).*)?$/.test(pathname);

  if (isDashboardRoute && !isAuthRoute && !isPublicRoute && !user) {
    const locale = pathname.split('/')[1] || 'fr';
    const welcomeUrl = new URL(`/${locale}/welcome`, request.url);
    return NextResponse.redirect(welcomeUrl);
  }

  // If logged in and trying to access auth or welcome, redirect to dashboard (allow privacy/terms)
  const isWelcome = /^\/(fr|en|he|ru)\/welcome/.test(pathname);
  if ((isAuthRoute || isWelcome) && user) {
    const locale = pathname.split('/')[1] || 'fr';
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
  matcher: ['/', '/(fr|en|he|ru)', '/(fr|en|he|ru)/:path*'],
};
