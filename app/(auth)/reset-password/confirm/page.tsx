import Password from "@/components/auth/Password"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "新しいパスワードの設定",
  description: "新しいパスワードを設定して、アカウントのセキュリティを確保します。",
}

const RestPasswordConfirmPage = () => {
  return <Password />
}

export default RestPasswordConfirmPage
