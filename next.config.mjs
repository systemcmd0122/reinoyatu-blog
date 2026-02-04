import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
});

export default withPWA({
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
});