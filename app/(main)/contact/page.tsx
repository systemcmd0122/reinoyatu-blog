// app/(main)/contact/page.tsx
import Contact from "@/components/contact/page"
import { Metadata } from "next"
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd"

export const metadata: Metadata = {
    title: "お問い合わせ",
    description: "例のヤツ｜ブログ - ご質問やご意見は、こちらのフォームからお気軽にお問い合わせください。",
    openGraph: {
        title: "お問い合わせ",
        description: "ご質問やご意見は、こちらのフォームからお気軽にお問い合わせください。",
        url: "https://reinoyatu-blog.vercel.app/contact",
        type: "website",
    },
}

const ContactPage = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    return (
        <>
            <BreadcrumbListJsonLd
                items={[
                    { name: "ホーム", url: baseUrl },
                    { name: "お問い合わせ", url: `${baseUrl}/contact` },
                ]}
            />
            <Contact />
        </>
    )
}

export default ContactPage
