import Password from "@/components/settings/Password"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "パスワード変更",
  description: "セキュリティ向上のため、パスワードを定期的に変更することをおすすめします。",
}

const PasswordPage = () => {
  return <Password />
}

export default PasswordPage
