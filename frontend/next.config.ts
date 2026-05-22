import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Local development
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      // Railway production — add NEXT_PUBLIC_BACKEND_HOST in Vercel env vars
      ...(process.env.NEXT_PUBLIC_BACKEND_HOST
        ? [{ protocol: 'https' as const, hostname: process.env.NEXT_PUBLIC_BACKEND_HOST, pathname: '/uploads/**' }]
        : [{ protocol: 'https' as const, hostname: '*.railway.app', pathname: '/uploads/**' }]
      ),
    ],
    formats: ['image/webp'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
