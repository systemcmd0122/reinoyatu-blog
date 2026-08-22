// app/privacy-policy/page.tsx
import PrivacyPolicy from "@/components/privacypolicy/page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: '個人情報の取り扱いと保護に関するプライバシーポリシー',
  openGraph: {
    title: 'プライバシーポリシー | 例のヤツ｜ブログ',
    description: '個人情報の取り扱いと保護に関するプライバシーポリシー',
    type: 'website',
  },
}

const PrivacyPolicyPage = () => {
  return <PrivacyPolicy />
}

export default PrivacyPolicyPage