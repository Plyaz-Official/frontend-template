import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// API routes that should REMAIN accessible in production
const PROD_ALLOWED_API_ROUTES = [
  /^\/api\/events\/stream$/, // SSE streaming endpoint
];

// Routes that should only be accessible in development/staging
const DEV_ONLY_PATTERNS = [
  // API routes (block all except allowed ones)
  /^\/api\/examples(\/.*)?$/, // /api/examples and all sub-routes
  /^\/api\/files(\/.*)?$/, // /api/files and all sub-routes
  /^\/api\/upload(\/.*)?$/, // /api/upload and all sub-routes
  /^\/api\/generate-document$/, // /api/generate-document
  /^\/api\/notifications(\/.*)?$/, // /api/notifications and all sub-routes
  // Page routes
  /^\/[a-z]{2}\/example$/, // /en/example, /es/example, etc.
  /^\/example$/, // /example (without locale)
];

function isDevOnlyRoute(pathname: string): boolean {
  // First check if it's an explicitly allowed production route
  if (PROD_ALLOWED_API_ROUTES.some(pattern => pattern.test(pathname))) {
    return false;
  }
  return DEV_ONLY_PATTERNS.some(pattern => pattern.test(pathname));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  // Block dev-only routes in production
  if (isProduction && isDevOnlyRoute(pathname)) {
    return NextResponse.json(
      { error: 'Not found', message: 'This endpoint is not available in production' },
      { status: 404 }
    );
  }

  // For non-API routes, use intl middleware
  if (!pathname.startsWith('/api')) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  // Match all pathnames including API routes for dev-only blocking
  matcher: [
    // Match all pathnames except static files
    '/((?!_next|_vercel|.*\\..*).*)',
    // Also match API routes for dev-only restriction
    '/api/:path*',
  ],
};
