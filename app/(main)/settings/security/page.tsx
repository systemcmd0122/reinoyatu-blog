import Password from "@/components/settings/Password"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "セキュリティ設定",
  description: "パスワードの変更やアカウントのセキュリティ設定を管理します。",
}

const SecurityPage = () => {
  return <Password />
}

export default SecurityPage
