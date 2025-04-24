import type { NextConfig } from 'next';
import type { Configuration, RuleSetRule, RuleSetUseItem } from 'webpack';

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
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    // Ensure config.module and config.module.rules are defined
    if (!config.module) {
      config.module = { rules: [] };
    }
    if (!config.module.rules) {
      config.module.rules = [];
    }

    // Find and modify the CSS rule
    const cssRule = config.module.rules.find(
      (rule: false | "" | 0 | RuleSetRule | "..." | null | undefined): rule is RuleSetRule =>
        !!rule &&
        typeof rule === 'object' &&
        Object.prototype.hasOwnProperty.call(rule, 'test') &&
        !!rule.test &&
        typeof rule.test.toString === 'function' &&
        rule.test.toString().includes('.css')
    );

    if (cssRule) {
      if (!cssRule.use || !Array.isArray(cssRule.use)) {
        cssRule.use = [];
      }
      cssRule.use = (cssRule.use as RuleSetUseItem[]).filter(
        (loader) =>
          !(
            typeof loader === 'object' &&
            loader !== null &&
            'loader' in loader &&
            typeof loader.loader === 'string' &&
            loader.loader.includes('postcss-loader')
          )
      );
    }

    // Add custom CSS rule
    config.module.rules.push({
      test: /\.css$/i,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 0,
            modules: {
              auto: true,
              localIdentName: '[path][name]__[local]--[hash:base64:5]',
            },
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;