// app/(main)/contact/page.tsx
import Contact from "@/components/contact/page"
import { Metadata } from "next"

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
    return <Contact />
}

export default ContactPage
