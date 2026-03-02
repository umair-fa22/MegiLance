// @AI-HINT: Next.js middleware for security headers, authentication, and request handling
// Follows Vercel best practices for middleware: https://nextjs.org/docs/app/guides/content-security-policy

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to add security headers to all responses
 * and handle authentication redirects
 * 
 * Best practices applied:
 * - Comprehensive security headers (OWASP)
 * - Content Security Policy (CSP) with nonce
 * - Auth protection with proper redirect patterns
 * - Performance headers for static assets
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // === SECURITY HEADERS (OWASP Top 10 + Vercel best practices) ===
  const securityHeaders: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), bluetooth=()',
    'X-DNS-Prefetch-Control': 'on',
    // Prevent MIME-sniffing attacks
    'X-Download-Options': 'noopen',
    // Prevent Adobe Flash/PDF cross-domain data loading  
    'X-Permitted-Cross-Domain-Policies': 'none',
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // === CONTENT SECURITY POLICY (CSP) ===
  if (process.env.NODE_ENV === 'production') {
    // CSP compatible with Next.js App Router (inline scripts/styles required for hydration)
    // 'unsafe-inline' is needed because Next.js injects inline scripts/styles for hydration,
    // JSON-LD structured data, and theme initialization that cannot carry nonces automatically.
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com wss: https:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "media-src 'self'",
    ];
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  }

  // === HSTS (Strict Transport Security) ===
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // === AUTHENTICATION REDIRECTS ===
  
  // Protected portal routes that require authentication
  const protectedPaths = [
    '/client/',
    '/client',
    '/freelancer/',
    '/freelancer',
    '/admin/',
    '/admin',
    '/dashboard',
    '/settings',
    '/messages',
    '/wallet',
    '/onboarding',
    '/contracts',
    '/proposals',
    '/invoices',
    '/escrow',
    '/reviews',
    '/video-calls',
  ];

  const isProtectedPath = protectedPaths.some(path => 
    pathname === path.replace(/\/$/, '') || pathname.startsWith(path)
  );
  
  // Check for auth token in cookies (httpOnly preferred)
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (isProtectedPath && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Server-side dashboard redirect: decode JWT role to skip client-side spinner
  if (pathname === '/dashboard' && authToken) {
    try {
      const base64Url = authToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const role = (payload.user_type || payload.role || 'client').toLowerCase();
      const target = role === 'admin' ? '/admin/dashboard'
        : role === 'freelancer' ? '/freelancer/dashboard'
        : '/client/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    } catch {
      // Invalid JWT — fall through to client-side handling
    }
  }

  // Prevent browser/CDN caching of authenticated portal pages
  if (isProtectedPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
  }

  // Prevent authenticated users from accessing auth pages
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthPath = authPaths.some(path => pathname === path);

  // Prevent CDN from caching auth pages (login, signup, etc.)
  // CDN can cache RSC flight payloads (text/x-component) and serve them
  // for HTML page loads, causing blank/broken pages.
  if (isAuthPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
  }

  // Tell CDN to vary cache by RSC header so RSC flight requests
  // and full HTML page loads are cached separately
  response.headers.set('Vary', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch');
  
  if (isAuthPath && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // === SECURITY: Block suspicious paths ===
  const blockedPaths = [
    '/wp-admin', '/wp-login', '/.env', '/.git',
    '/phpinfo', '/php', '/cgi-bin', '/actuator',
  ];
  
  if (blockedPaths.some(blocked => pathname.startsWith(blocked))) {
    return new NextResponse(null, { status: 404 });
  }

  return response;
}

/**
 * Configure which paths the middleware runs on
 * Following Next.js best practice: exclude static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - API routes (handled by backend proxy)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
