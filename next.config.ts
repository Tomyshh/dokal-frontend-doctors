import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.arb': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
  webpack(config) {
    // When running without Turbopack, import `.arb` files as raw text.
    config.module.rules.push({ test: /\.arb$/i, use: 'raw-loader' });
    return config;
  },
};

export default withNextIntl(nextConfig);
