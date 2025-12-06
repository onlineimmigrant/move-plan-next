const withNextIntl = require('next-intl/plugin')(
  // This is the default location for the i18n config
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Modularize imports for better tree-shaking
  modularizeImports: {
    'react-icons/fa': {
      transform: 'react-icons/fa/{{member}}',
    },
    'react-icons/fa6': {
      transform: 'react-icons/fa6/{{member}}',
    },
    'react-icons/fi': {
      transform: 'react-icons/fi/{{member}}',
    },
    'react-icons/hi': {
      transform: 'react-icons/hi/{{member}}',
    },
    'react-icons/md': {
      transform: 'react-icons/md/{{member}}',
    },
    'react-icons/tb': {
      transform: 'react-icons/tb/{{member}}',
    },
    'react-icons/tfi': {
      transform: 'react-icons/tfi/{{member}}',
    },
    'react-icons/ri': {
      transform: 'react-icons/ri/{{member}}',
    },
    'react-icons/io': {
      transform: 'react-icons/io/{{member}}',
    },
  },
  experimental: {
    optimizeCss: false,
  },
  // Enable geolocation for Vercel deployments + SEO performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-vercel-ip-country',
          },
        ],
        headers: [
          {
            key: 'x-user-country',
            value: '%{x-vercel-ip-country}i',
          },
        ],
      },
      // SEO Performance: Cache static pages aggressively
      {
        source: '/:locale(en|es|fr|de|ru|it|pt|zh|ja|pl|nl)/:path(about|contact|privacy-policy|terms-of-service|cookie-policy)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      // SEO Performance: Cache blog posts
      {
        source: '/:locale(en|es|fr|de|ru|it|pt|zh|ja|pl|nl)/blog/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=900, stale-while-revalidate=3600',
          },
        ],
      },
      // SEO Performance: Cache product pages
      {
        source: '/:locale(en|es|fr|de|ru|it|pt|zh|ja|pl|nl)/products/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=1800',
          },
        ],
      },
      // SEO Performance: Cache sitemap
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  images: {
    // Added 85 to support components using quality={85}
    qualities: [75, 85, 90, 100],
    remotePatterns: [

      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rgbmdfaoowqbgshjuwwm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'rgbmdfaoowqbgshjuwwm.storage.supabase.co',
        pathname: '/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'videos.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-6891bafd3bd54c36b02da71be2099135.r2.dev',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    // Suppress webpack cache serialization warnings for large strings
    if (config.infrastructureLogging) {
      config.infrastructureLogging.level = 'error';
    } else {
      config.infrastructureLogging = { level: 'error' };
    }
    
    // Optimize chunk splitting for better caching and smaller initial bundles
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate TipTap editor into its own chunk (only loaded when editing)
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: 'tiptap',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Separate AWS SDK into its own chunk
            aws: {
              test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
              name: 'aws-sdk',
              priority: 35,
              reuseExistingChunk: true,
            },
            // Separate react-icons to enable tree-shaking
            reactIcons: {
              test: /[\\/]node_modules[\\/]react-icons[\\/]/,
              name: 'react-icons',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Separate Framer Motion
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Supabase into separate chunk
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common UI libraries
            headlessui: {
              test: /[\\/]node_modules[\\/]@headlessui[\\/]/,
              name: 'headlessui',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Default vendor chunk for other node_modules
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = withNextIntl(nextConfig);