/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Next.js resolves workspace root correctly when multiple lockfiles exist
  outputFileTracingRoot: __dirname,
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Optimize bundle
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'openai', 'langchain', 'lucide-react', '@vercel/analytics'],
  },
  
  // Modern browsers only - no legacy polyfills
  transpilePackages: [],
  
  // Modularize imports for better tree shaking
  modularizeImports: {
    'react-markdown': {
      transform: 'react-markdown',
    },
    'remark-gfm': {
      transform: 'remark-gfm',
    },
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Compression
  compress: true,

  // Proxy for subdomains to external sites (keeps URL unchanged)
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [
            {
              type: 'host',
              value: 'careers.hretheum.com',
            },
          ],
          destination: 'https://hretheum.notion.site/open',
        },
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'careers.hretheum.com',
            },
          ],
          destination: 'https://hretheum.notion.site/open/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
