import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import BlogNew from "@/components/blog/BlogNew"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "新しい記事を作成",
  description: "あなたの新しいストーリーを共有しましょう。リッチテキストエディタを使って、魅力的なブログ記事を作成できます。",
}

const BlogNewPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect("/login?next=/blog/new")
  }

  return <BlogNew userId={user.id} />
}

export default BlogNewPage
