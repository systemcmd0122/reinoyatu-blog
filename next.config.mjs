/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wetcuwhkglcszcktcaxl.supabase.co",
      },
    ],
  },
}

export default nextConfig
