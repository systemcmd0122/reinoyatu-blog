import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Signup from "@/components/auth/Signup"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "新規登録",
  description: "例のヤツ｜ブログに新しくアカウントを作成して、あなたのアイデアを世界に共有しましょう。",
}

const SignupPage = async () => {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (user) {
    redirect("/")
  }

  return <Signup />
}

export default SignupPage
