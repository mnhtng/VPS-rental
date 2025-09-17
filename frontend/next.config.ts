import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
};

export default withNextIntl(nextConfig);