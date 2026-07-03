import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "AIと対話して記事を作成",
  description: "AIとチャットするだけで、あなたのストーリーを記事にしましょう。",
}

const BlogAICreate = dynamic(
  () => import("@/components/blog/BlogAICreate"),
  {
    loading: () => (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">AIエディタを読み込み中...</p>
        </div>
      </div>
    ),
  }
)

const BlogAINewPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect("/login?next=/blog/ai-new")
  }

  return <BlogAICreate userId={user.id} />
}

export default BlogAINewPage
