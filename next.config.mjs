/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wetcuwhkglcszcktcaxl.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);