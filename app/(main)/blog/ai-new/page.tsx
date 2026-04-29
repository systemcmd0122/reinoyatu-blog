import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import BlogAICreate from "@/components/blog/BlogAICreate"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AIと対話して記事を作成",
  description: "AIとチャットするだけで、あなたのストーリーを記事にしましょう。",
}

const BlogAINewPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    // redirect("/login?next=/blog/ai-new")
    return <BlogAICreate userId="test-user" />
  }

  return <BlogAICreate userId={user.id} />
}

export default BlogAINewPage
