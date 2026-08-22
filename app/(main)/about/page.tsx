// app/(main)/about/page.tsx
import About from "@/components/about/page"
import { Metadata } from "next"
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd"

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    return (
        <>
            <BreadcrumbListJsonLd
                items={[
                    { name: "ホーム", url: baseUrl },
                    { name: "例のヤツについて", url: `${baseUrl}/about` },
                ]}
            />
            <About />
        </>
    )
}

export default AboutPage
