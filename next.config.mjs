/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cache Buster: 2026-01-08-v2 - Force rebuild to clear sharp artifacts
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
