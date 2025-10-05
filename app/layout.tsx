import "./globals.css"
import "katex/dist/katex.min.css"
import type { Metadata, Viewport } from "next"
import { M_PLUS_1 } from "next/font/google"
import { createClient } from "@/utils/supabase/server"
import Navigation from "@/components/navigation/Navigation"
import ToastProvider from "@/components/providers/ToastProvider"

const mPlus1 = M_PLUS_1({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
})

const siteConfig = {
  title: "例のヤツ｜ブログ",
  description: "例のヤツを主催とした様々なことを投稿・共有するたのめのサイトです。",
  keywords: ["例のヤツ", "例のやつ", "ブログ", "例のヤツブログ", "例のヤツ｜ブログ"],
  url: "https://reinoyatu-blog.vercel.app/",
  ogImage: "/og-image.png",
  twitterHandle: "@reinoyatu",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    template: `%s | ${siteConfig.title}`,
    default: siteConfig.title,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: "例のヤツ" }],
  creator: "例のヤツ",
  robots: "index, follow",

  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },

  other: {
    "discord:type": "website",
    "discord:title": siteConfig.title,
    "discord:description": siteConfig.description,
    "discord:image": siteConfig.ogImage,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

interface RootLayoutProps {
  children: React.ReactNode
}

// ルートレイアウト
const RootLayout = async ({ children }: RootLayoutProps) => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()



  return (
    <html lang="ja">
      <body className={mPlus1.className}>
        <meta name="google-site-verification" content="HRR3HjapAEcd9RMteRtz52tQQjG5WFSMMFNap--f4vI" />
        <ToastProvider />
        <div className="flex min-h-screen flex-col">
          <Navigation user={user} />

          <main className="flex-1">{children}</main>

          <footer className="border-t py-2">
            <div className="flex flex-col items-center justify-center text-sm space-y-5">
              <div>©例のヤツ｜ブログ. ALL Rights Reserved.</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

export default RootLayout