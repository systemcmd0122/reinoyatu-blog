// app/privacy-policy/page.tsx
import PrivacyPolicy from "@/components/privacypolicy/page"

export const metadata = {
  title: 'プライバシーポリシー',
  description: '個人情報の取り扱いと保護に関するプライバシーポリシー'
}

const PrivacyPolicyPage = () => {
  return <PrivacyPolicy />
}

export default PrivacyPolicyPage