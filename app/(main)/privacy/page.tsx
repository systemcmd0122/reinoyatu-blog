// app/privacy-policy/page.tsx
import { Suspense } from "react"
import PrivacyPolicy from "@/components/privacypolicy/page"
import Loading from "@/app/loading"

export const metadata = {
  title: 'プライバシーポリシー | 例のヤツ｜ブログ',
  description: '個人情報の取り扱いと保護に関するプライバシーポリシー'
}

const PrivacyPolicyPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <PrivacyPolicy />
    </Suspense>
  )
}

export default PrivacyPolicyPage