import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import BlogDetail from "@/components/blog/BlogDetail"
import Loading from "@/app/loading"

interface BlogDetailPageProps {
  params: {
    blogId: string
  }
}

const BlogDetailPage = async ({ params }: BlogDetailPageProps) => {
  const { blogId } = params
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  // ブログ詳細取得
  const { data: blogData } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles (
        name,
        avatar_url,
        introduce
      )
    `
    )
    .eq("id", blogId)
    .single()

  if (!blogData) {
    return <div className="text-center">ブログが存在しません</div>
  }

  // いいね数を取得
  const { data: likesCountData } = await supabase.rpc(
    'get_blog_likes_count',
    { blog_id: blogId }
  )

  // いいね数をブログデータに追加
  const blogWithLikes = {
    ...blogData,
    likes_count: likesCountData || 0
  }

  // ログインユーザーがブログ作成者かどうか
  const isMyBlog = user?.id === blogData.user_id

  return (
    <Suspense fallback={<Loading />}>
      <BlogDetail blog={blogWithLikes} isMyBlog={isMyBlog} currentUserId={user?.id} />
    </Suspense>
  )
}

export default BlogDetailPage