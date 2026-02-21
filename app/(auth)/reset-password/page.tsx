import ResetPassword from "@/components/auth/ResetPassword"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "パスワードを忘れた方",
  description: "パスワードをリセットするためのリンクを送信します。",
}

// パスワード再設定ページ
const ResetPasswordPage = async () => {
  return <ResetPassword />
}

export default ResetPasswordPage
