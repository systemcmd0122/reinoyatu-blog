import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "新しい記事を作成",
  description: "あなたの新しいストーリーを共有しましょう。リッチテキストエディタを使って、魅力的なブログ記事を作成できます。",
}

const BlogNew = dynamic(
  () => import("@/components/blog/BlogNew"),
  {
    loading: () => (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">エディタを読み込み中...</p>
        </div>
      </div>
    ),
  }
)

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
