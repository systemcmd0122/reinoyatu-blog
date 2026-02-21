import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import BlogEdit from "@/components/blog/BlogEdit"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "記事を編集",
  description: "記事の内容を更新して、より良いコンテンツに仕上げましょう。",
}

interface BlogEditPageProps {
  params: Promise<{
    blogId: string
  }>
}

const BlogEditPage = async ({ params }: BlogEditPageProps) => {
  const { blogId } = await params
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect(`/login?next=/blog/${blogId}/edit`)
  }

  // ブログ詳細取得
  const { data: blogData } = await supabase
    .from("blogs")
    .select("*, tags(name), article_authors(user_id, role)")
    .eq("id", blogId)
    .single()

  if (!blogData) {
    return <div className="text-center">ブログが存在しません</div>
  }

  // 権限チェック（作成者または共同編集者）
  const isAuthor = blogData.user_id === user.id || 
                   blogData.article_authors?.some((aa: any) => aa.user_id === user.id)

  if (!isAuthor) {
    redirect(`/blog/${blogData.id}`)
  }

  return <BlogEdit blog={blogData} />
}

export default BlogEditPage
