const path = require('path');

const withNextIntl = require('next-intl/plugin')(
  // This is the default location for the i18n config
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Target modern browsers - exclude polyfills for ES2020+ features
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Production optimizations
  compress: true, // Enable gzip compression
  productionBrowserSourceMaps: false, // Disable source maps in production
  reactStrictMode: true, // Enable React strict mode for better performance
  // React Compiler for automatic memoization
  reactCompiler: false, // Set to true when React Compiler is stable
  // Turbopack configuration
  turbopack: {
    root: __dirname, // Explicitly set workspace root to silence lockfile warning
  },
  experimental: {
    optimizeCss: true, // Enable Critters for inlining critical CSS and deferring the rest
    cssChunking: 'strict', // Reduce CSS chunk fragmentation for faster loading
    // Enable optimized package imports for faster initial load
    optimizePackageImports: [
      'lucide-react', 
      '@heroicons/react', 
      '@headlessui/react',
      '@tanstack/react-query',
      'date-fns',
      'clsx',
      'react-hook-form',
      'react-markdown',
      'remark-gfm',
      'rehype-raw',
      'rehype-sanitize',
      'framer-motion',
      'react-icons',
      '@tiptap/react',
    ],
    // Reduce memory usage and improve performance
    webpackMemoryOptimizations: true,
    // Enable more aggressive tree-shaking
    optimizeServerReact: true,
  },
  // Exclude polyfills - target modern browsers only
  transpilePackages: [],
  // Override SWC to exclude polyfills - target ES2022
  env: {
    NEXT_PUBLIC_BROWSERSLIST_CONFIG: '>0.3%, not dead, not op_mini all'
  },
  // Minimize output for production
  output: 'standalone',
  // Enable experimental turbo mode for faster builds (if available)
  // turbo: {},
  modularizeImports: {
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
      // SSG: Cache blog posts immutably (pre-rendered at build time) - with locale prefix
      {
        source: '/:locale(en|es|fr|de|ru|it|pt|zh|ja|pl|nl)/:slug([a-z0-9-]+)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // SSG: Cache blog posts immutably - default locale WITHOUT prefix (critical for performance)
      {
        source: '/:slug([a-z0-9-]+)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // SSG: Cache product pages immutably (pre-rendered at build time) - with locale prefix
      {
        source: '/:locale(en|es|fr|de|ru|it|pt|zh|ja|pl|nl)/products/:id([a-z0-9-]+)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // SSG: Cache product pages immutably - default locale WITHOUT prefix
      {
        source: '/products/:id([a-z0-9-]+)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // SSG: Cache homepage immutably - with locale prefix
      {
        source: '/:locale(en|es|fr|de|ru|it|pt|zh|ja|pl|nl)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // SSG: Cache homepage immutably - default locale WITHOUT prefix
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    // Support adaptive image quality from 60-100 for mobile optimization
    qualities: [60, 70, 75, 85, 90, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.codedharmony.app',
        pathname: '/**',
      },
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
  webpack: (config, { isServer, dev }) => {
    // Target modern browsers - ES2020+ support
    if (!isServer) {
      config.target = 'web';
      // Set browserslist environment to production for modern builds
      process.env.BROWSERSLIST_ENV = 'modern';

      // Remove Next.js runtime module polyfills from the main client bundle.
      // This reduces "Legacy JavaScript" warnings in Lighthouse, but may break very old browsers.
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['next/dist/build/polyfills/polyfill-module'] = path.resolve(
        __dirname,
        'src/polyfills/next-polyfill-module-empty.js'
      );
      
      // Configure SWC loader to target ES2022 without polyfills
      config.module.rules.forEach((rule) => {
        if (rule.use && rule.use.loader === 'next-swc-loader') {
          rule.use.options = {
            ...rule.use.options,
            jsc: {
              ...rule.use.options?.jsc,
              target: 'es2022',
            },
            env: {
              targets: 'Chrome >= 92, Firefox >= 90, Safari >= 15.4, Edge >= 92',
              mode: undefined, // Disable env transforms completely
            },
          };
        }
      });
    }
    
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
      // Note: usedExports removed - conflicts with cacheUnaffected
      config.optimization.sideEffects = true;
      
      // Reduce chunk overhead for faster parsing
      config.optimization.runtimeChunk = {
        name: 'webpack-runtime'
      };
      
      // Split manifest into separate chunk for better caching
      config.optimization.moduleIds = 'deterministic';
      
      // Optimize CSS loading to prevent render blocking
      config.optimization.realContentHash = true; // Better long-term caching
    }
    
    // Optimize chunk splitting for better caching and smaller initial bundles
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 15000, // Lower threshold to split more aggressively
          maxAsyncRequests: 30,
          maxSize: 50000, // Split chunks larger than 50KB to reduce main thread blocking
          minChunks: 1,
          // Reduce webpack runtime overhead
          automaticNameDelimiter: '.',
          cacheGroups: {
            // Separate TipTap editor into its own chunk (only loaded when editing)
            tiptap: {
              test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
              name: 'tiptap',
              priority: 40,
              chunks: 'async', // Defer loading
              enforce: true,
              reuseExistingChunk: true,
            },
            // Twilio Video - large library only for video calls
            twilioVideo: {
              test: /[\\/]node_modules[\\/]twilio-video[\\/]/,
              name: 'vendors.twilio-video',
              priority: 38,
              chunks: 'async', // Critical: Only load when video call starts
              enforce: true,
              reuseExistingChunk: true,
            },
            // Separate AWS SDK into its own chunk
            aws: {
              test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
              name: 'aws-sdk',
              priority: 35,
              chunks: 'async', // Defer loading
              enforce: true,
              reuseExistingChunk: true,
            },
            // Lucide React - large icon library, load async
            lucideReact: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'vendors.lucide-react',
              priority: 33,
              chunks: 'async', // Defer - only load icons when needed
              enforce: true,
              reuseExistingChunk: true,
            },
            // Heroicons - split but keep initial since used in Header
            heroicons: {
              test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
              name: 'vendors.heroicons',
              priority: 32,
              chunks: 'initial', // Keep in initial - used in Header
              enforce: true,
              reuseExistingChunk: true,
              maxSize: 20000, // Split more aggressively to reduce main thread blocking
            },
            // Separate react-icons to enable tree-shaking
            reactIcons: {
              test: /[\\/]node_modules[\\/]react-icons[\\/]/,
              name: 'react-icons',
              priority: 30,
              chunks: 'async', // Defer loading
              enforce: true,
              reuseExistingChunk: true,
            },
            // Separate Framer Motion - only load when animations needed
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 25,
              chunks: 'async', // Defer - animations load after initial paint
              enforce: true,
              reuseExistingChunk: true,
            },
            // Supabase into separate chunk
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common UI libraries - headlessui used in Header (can't defer)
            headlessui: {
              test: /[\/]node_modules[\/]@headlessui[\/]/,
              name: 'headlessui',
              priority: 15,
              chunks: 'initial',
              minSize: 10000,
              maxSize: 30000, // Split more aggressively to keep chunks under 50ms parse time
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
              test: /[\/]node_modules[\/]next[\/]dist[\/]compiled[\/]/,
              name: 'vendors.next-compiled',
              priority: 11,
              chunks: 'initial',
              maxSize: 40000, // Split into max 40KB chunks to keep parse time under 50ms
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
              test(module) {
                // Only match node_modules
                if (!/[\\/]node_modules[\\/]/.test(module.context || '')) return false;
                
                // Exclude packages that have explicit cache groups
                const excludePatterns = [
                  'lucide-react',
                  '@heroicons',
                  'react-icons',
                  'framer-motion',
                  '@supabase',
                  '@headlessui',
                  '@tiptap',
                  'twilio-video',
                  '@aws-sdk',
                  'next/dist',
                  'react',
                  'react-dom',
                  'scheduler'
                ];
                
                return !excludePatterns.some(pattern => 
                  (module.context || '').includes(`node_modules${path.sep}${pattern}`)
                );
              },
              name(module) {
                // Get package name
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                // Create chunk based on package name, sanitized for filename
                return `vendors.${packageName?.replace('@', '')}`;
              },
              priority: 5, // Lower priority than explicit cache groups
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Force new build ID on every deployment to prevent chunk mismatches
  generateBuildId: async () => {
    // Use timestamp to ensure unique build ID
    return `build-${Date.now()}`;
  },
};

module.exports = withNextIntl(nextConfig);