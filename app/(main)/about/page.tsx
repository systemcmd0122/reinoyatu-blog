// app/(main)/about/page.tsx
import About from "@/components/about/page"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "例のヤツについて",
    description: "例のヤツ｜ブログ - 共創型ブログプラットフォームについて。私たちの理念、ビジョン、そして実現している機能についてご紹介します。",
    openGraph: {
        title: "例のヤツについて",
        description: "共創型ブログプラットフォームについて。私たちの理念、ビジョン、そして実現している機能についてご紹介します。",
        url: "https://reinoyatu-blog.vercel.app/about",
        type: "website",
    },
}

const AboutPage = () => {
    return <About />
}

export default AboutPage
