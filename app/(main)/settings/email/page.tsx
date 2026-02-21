import Email from "@/components/settings/Email"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "メールアドレス設定",
  description: "登録されているメールアドレスの確認や変更を行えます。",
}

const EmailPage = () => {
  return <Email />
}

export default EmailPage
