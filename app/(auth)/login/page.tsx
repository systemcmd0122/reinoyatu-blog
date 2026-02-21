import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Login from "@/components/auth/Login"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ログイン",
  description: "例のヤツ｜ブログにログインして、最新の記事をチェックしたり、新しいストーリーを投稿したりしましょう。",
}

interface LoginPageProps {
  searchParams: Promise<{
    next?: string
  }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { next } = await searchParams
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (user) {
    redirect(next || "/")
  }

  return <Login next={next} />
}

export default LoginPage