import type { NextConfig } from 'next';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  // Load .env.local only in development to avoid exposing secrets in production builds
  dotenv.config({ path: '.env' });
}

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'codedharmony.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
  // Optional: Expose specific environment variables to client-side if needed
  env: {
    // If you need these on the client, prefix with NEXT_PUBLIC_ (not recommended for service role key)
     NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
     NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY, // Avoid this for security
  },
};

export default nextConfig;