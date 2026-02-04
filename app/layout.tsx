import "./globals.css"
import "katex/dist/katex.min.css"
import type { Metadata, Viewport } from "next"
import { M_PLUS_1 } from "next/font/google"
import { createClient } from "@/utils/supabase/server"
import Navigation from "@/components/navigation/Navigation"
import Link from "next/link"
import ToastProvider from "@/components/providers/ToastProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const mPlus1 = M_PLUS_1({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
})

const siteConfig = {
  title: "例のヤツ｜ブログ",
  description:
    "例のヤツを主催とした様々なことを投稿・共有するためのブログプラットフォームです。",
  keywords: [
    "例のヤツ",
    "例のやつ",
    "ブログ",
    "例のヤツブログ",
    "例のヤツ｜ブログ",
  ],
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
    "google-site-verification":
      "HRR3HjapAEcd9RMteRtz52tQQjG5WFSMMFNap--f4vI",
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={mPlus1.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider />

          <div className="flex min-h-screen flex-col">
            <Navigation user={user} />

            <main className="flex-1">{children}</main>

            <SpeedInsights />
            <Analytics />

            <footer className="border-t py-12 bg-gray-50 dark:bg-gray-900/50">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">例のヤツ｜ブログ</h3>
                    <p className="text-sm text-muted-foreground">
                      あなたのアイデア、ストーリー、専門知識を共有し、世界と繋がるプラットフォーム。
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">リンク</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <Link
                          href="/"
                          className="hover:text-primary transition-colors"
                        >
                          ホーム
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/guide/markdown"
                          className="hover:text-primary transition-colors"
                        >
                          マークダウンガイド
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/privacy"
                          className="hover:text-primary transition-colors"
                        >
                          プライバシーポリシー
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">アカウント</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <Link
                          href="/login"
                          className="hover:text-primary transition-colors"
                        >
                          ログイン
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/signup"
                          className="hover:text-primary transition-colors"
                        >
                          新規登録
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                  <div>
                    © {new Date().getFullYear()} 例のヤツ｜ブログ. All Rights
                    Reserved.
                  </div>
                  <div className="flex items-center space-x-6">
                    <a
                      href="https://twitter.com/reinoyatu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      X (Twitter)
                    </a>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
