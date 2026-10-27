/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  images: {
    unoptimized: true, // Required for static export
  },
  typedRoutes: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hurrykit.com',
    NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID ?? '',
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? 'development',
  },
  // Headers via _headers file (Cloudflare Pages); Next.js headers() not used in static export
  // CSP is applied via public/_headers file
  webpack(config) {
    // Allow .wasm files to be imported
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

module.exports = nextConfig;
