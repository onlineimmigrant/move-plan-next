/** @type {import('next').NextConfig} */
const nextConfig = {
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
  webpack: (config, { isServer }) => {
    const cssRule = config.module.rules.find((rule) =>
      rule.test?.toString().includes('.css')
    );

    if (cssRule) {
      cssRule.use = cssRule.use.filter(
        (loader) => !loader.loader?.includes('postcss-loader')
      );
    }

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

module.exports = nextConfig;