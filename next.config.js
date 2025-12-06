const withNextIntl = require('next-intl/plugin')(
  // This is the default location for the i18n config
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Target modern browsers - exclude polyfills for ES2020+ features
  swcMinify: true,
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Target ES2020+ to avoid unnecessary polyfills (saves ~12KB)
    target: 'ES2020',
  },
  // Modularize imports for better tree-shaking (reduces bundle size by ~500KB)
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
    // Tree-shake lucide-react (134KB → ~10KB per icon)
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    // Tree-shake @heroicons/react (32KB → ~2KB per icon)
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
    '@heroicons/react/20/solid': {
      transform: '@heroicons/react/20/solid/{{member}}',
    },
  },
  experimental: {
    optimizeCss: false,
    // Enable optimized package imports for faster initial load
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'framer-motion', '@headlessui/react'],
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
    
    // Mark heavy packages for async loading
    if (!isServer) {
      // Enable faster parsing and smaller output
      config.optimization.minimize = true;
      config.optimization.concatenateModules = true;
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
      
      // Reduce chunk overhead for faster parsing
      config.optimization.runtimeChunk = {
        name: 'webpack-runtime'
      };
      
      // Split manifest into separate chunk for better caching
      config.optimization.moduleIds = 'deterministic';
    }
    
    // Optimize chunk splitting for better caching and smaller initial bundles
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxAsyncRequests: 30,
          // Reduce webpack runtime overhead
          automaticNameDelimiter: '.',
          cacheGroups: {
            // Separate TipTap editor into its own chunk (only loaded when editing)
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: 'tiptap',
              priority: 40,
              chunks: 'async', // Defer loading
              reuseExistingChunk: true,
            },
            // Twilio Video - large library only for video calls
            twilioVideo: {
              test: /[\\/]node_modules[\\/]twilio-video[\\/]/,
              name: 'vendors.twilio-video',
              priority: 38,
              chunks: 'async', // Critical: Only load when video call starts
              reuseExistingChunk: true,
            },
            // Separate AWS SDK into its own chunk
            aws: {
              test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
              name: 'aws-sdk',
              priority: 35,
              chunks: 'async', // Defer loading
              reuseExistingChunk: true,
            },
            // Lucide React - large icon library, load async
            lucideReact: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'vendors.lucide-react',
              priority: 33,
              chunks: 'async', // Defer - only load icons when needed
              reuseExistingChunk: true,
            },
            // Heroicons - defer until needed
            heroicons: {
              test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
              name: 'vendors.heroicons',
              priority: 32,
              chunks: 'async',
              reuseExistingChunk: true,
            },
            // Separate react-icons to enable tree-shaking
            reactIcons: {
              test: /[\\/]node_modules[\\/]react-icons[\\/]/,
              name: 'react-icons',
              priority: 30,
              chunks: 'async', // Defer loading
              reuseExistingChunk: true,
            },
            // Separate Framer Motion
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 25,
              chunks: 'async', // Defer - animations load after initial paint
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
              chunks: 'async', // Most headlessui components are in modals/dialogs
              reuseExistingChunk: true,
            },
            // React core libraries (shared across all pages)
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react-vendor',
              priority: 12,
              reuseExistingChunk: true,
            },
            // Split Next.js into smaller chunks for better parsing
            nextCore: {
              test: /[\\/]node_modules[\\/]next[\\/]dist[\\/]compiled[\\/]/,
              name: 'vendors.next-compiled',
              priority: 11,
              chunks: 'initial',
              reuseExistingChunk: true,
            },
            nextClient: {
              test: /[\\/]node_modules[\\/]next[\\/]dist[\\/]client[\\/]/,
              name: 'vendors.next-client',
              priority: 10,
              chunks: 'initial',
              reuseExistingChunk: true,
            },
            // Split remaining vendors by size
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                // Get package name
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                // Create chunk based on package name, sanitized for filename
                return `vendors.${packageName?.replace('@', '')}`;
              },
              priority: 10,
              minChunks: 1,
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