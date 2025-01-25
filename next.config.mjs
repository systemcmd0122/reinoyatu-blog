/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lofcrlplpvggpthluden.supabase.co",
      },
    ],
  },
}

export default nextConfig
