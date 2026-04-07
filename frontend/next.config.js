// @AI-HINT: This file configures Next.js, with PWA support enabled via @ducanh2912/next-pwa.
// Production-ready configuration with performance optimizations
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && process.env.NEXT_ENABLE_PWA !== '1',
  fallbacks: {
    document: '/~offline',
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 16, maxAgeSeconds: 60 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined, // Only for Docker/production
  
  // Security: Remove X-Powered-By header
  poweredByHeader: false,
  
  // Enable gzip compression
  compress: true,
  
  // React Strict Mode: catches bugs early (Vercel best practice)
  reactStrictMode: true,
  
  // Strip console.log and console.debug from production builds (security + performance)
  // console.warn and console.error are preserved for monitoring
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['warn', 'error'] }
      : false,
  },
  
  // TypeScript: enforce type safety in builds
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Dev logging: show fetch requests in terminal (Vercel best practice)
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Performance: Tree-shake & optimize heavy package imports
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'chart.js',
      'react-chartjs-2',
      'zod',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'three',
    ],
    // Enable server actions body size limit (security)
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  turbopack: {
    // Explicitly set root to silence multiple lockfiles warning
    root: process.env.TURBOPACK_ROOT || __dirname,
    resolveAlias: {
      '@': '.',
      // Shim Timer class for three-render-objects compatibility with newer three.js
      'three/src/misc/Timer.js': require('path').resolve(__dirname, './lib/three-timer-shim.ts'),
    },
  },
  
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
      // Shim Timer class for three-render-objects compatibility with newer three.js
      'three/src/misc/Timer.js': require('path').resolve(__dirname, './lib/three-timer-shim.ts'),
    };
    
    // Bundle analyzer in analyze mode
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
        })
      );
    }
    
    return config;
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache optimized images for at least 60 seconds
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'unpkg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
        { protocol: 'http', hostname: 'localhost' },
        { protocol: 'http', hostname: '127.0.0.1' },
        { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
  
  // Consistent trailing slashes for SEO (avoids duplicate URL issues)
  trailingSlash: false,
  
  // SEO + Performance headers
  // NOTE: Core security headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
  // are set in middleware.ts to avoid duplication.
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/login',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
          { key: 'Vary', value: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch' },
        ],
      },
      {
        source: '/signup',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
          { key: 'Vary', value: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch' },
        ],
      },
      {
        source: '/forgot-password',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
          { key: 'Vary', value: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch' },
        ],
      },
      {
        // Long cache for static images (Core Web Vitals improvement)
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/screenshots/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000' },
        ],
      },
      {
        // Sitemap and robots should be fresh but cacheable
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
      {
        // RSS feed should be fresh but cacheable
        source: '/blog/feed.xml',
        headers: [
          { key: 'Content-Type', value: 'application/rss+xml; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        // Preconnect to external resources for faster loading
        source: '/:path*',
        headers: [
          { key: 'Link', value: '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
  
  // Rewrites for local development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/:path*`,
      },
    ];
  },
  
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.megilance.com' }],
        destination: 'https://megilance.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.megilance.site' }],
        destination: 'https://megilance.site/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
