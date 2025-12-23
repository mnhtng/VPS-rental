import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['ptitcloud.io.vn', 'cloud.ptitcloud.io.vn', '*.ptitcloud.io.vn'],
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'github.com',
      'www.gravatar.com',
      'images.unsplash.com',
      'cdn.discordapp.com',
      'cdn.pixabay.com',
    ],
    remotePatterns: [
      new URL('https://lh3.googleusercontent.com/**'),
      new URL('https://avatars.githubusercontent.com/**'),
      new URL('https://github.com'),
      new URL('https://www.gravatar.com/**'),
      new URL('https://images.unsplash.com/**'),
      new URL('https://cdn.discordapp.com/**'),
      new URL('https://cdn.pixabay.com/**'),
      new URL('https://cdn.cloudflare.steamstatic.com/**'),
    ]
  },
  // Turbopack configuration for NextAuth.js compatibility
  // turbopack: {
  //   resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  // },
  // Webpack fallback for better compatibility
  // webpack: (config: any) => {
  //   config.resolve.fallback = {
  //     ...config.resolve.fallback,
  //     "crypto": require.resolve("crypto-browserify"), // npm install crypto-browserify
  //     "stream": require.resolve("stream-browserify"), // npm install stream-browserify
  //     "buffer": require.resolve("buffer"), // npm install buffer
  //   };
  //   return config;
  // },
};

export default withNextIntl(nextConfig);