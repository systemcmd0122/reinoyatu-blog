// app/(main)/terms/page.tsx
import TermsOfService from "@/components/terms/page"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "利用規約",
    description: "例のヤツ｜ブログ - サービス利用規約です。",
    openGraph: {
        title: "利用規約",
        description: "サービス利用規約です。",
        url: "https://reinoyatu-blog.vercel.app/terms",
        type: "website",
    },
}

const TermsPage = () => {
    return <TermsOfService />
}

export default TermsPage
