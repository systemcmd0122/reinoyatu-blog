import { createClient } from "@/utils/supabase/server"
import BlogDetail from "@/components/blog/BlogDetail"
import { Metadata } from "next"

interface BlogDetailPageProps {
  params: Promise<{
    blogId: string
  }>
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ページごとの動的メタデータを生成（Open Graph / Twitter Card）
export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { blogId } = await params
  if (!blogId || blogId === "undefined" || !uuidRegex.test(blogId)) {
    return {
      title: "記事が見つかりません｜例のヤツ",
      description: "指定された記事は見つかりませんでした。",
    }
  }
  const supabase = createClient()

  const { data: blogData } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      content,
      image_url,
      created_at,
      profiles (
        name
      )
    `
    )
  .eq("id", blogId)
    .single()

  if (!blogData) {
    return {
      title: "記事が見つかりません｜例のヤツ",
      description: "指定された記事は見つかりませんでした。",
    }
  }

  const title = blogData.title || "無題の投稿"
  // 簡易的にMarkdownや特殊文字を取り除いて説明文を生成
  const raw = blogData.content || ""
  const description = raw.replace(/[#_*`>\[\]()!-]/g, "").replace(/\n+/g, " ").slice(0, 160)

  const image = blogData.image_url || `${process.env.NEXT_PUBLIC_APP_URL || ""}/og-image.png`
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/blog/${blogId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "例のヤツ｜ブログ",
      images: [
        {
          url: image,
          alt: title,
        },
      ],
      type: "article",
      publishedTime: blogData.created_at,
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [image],
    },
  }
}

const BlogDetailPage = async ({ params }: BlogDetailPageProps) => {
  const { blogId } = await params
  if (!blogId || blogId === "undefined" || !uuidRegex.test(blogId)) {
    return <div className="text-center">ブログが存在しません</div>
  }
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  // ブログ詳細取得
  const { data: blogData } = await supabase
    .from("blogs")
    .select(`
      *,
      profiles (
        id,
        name,
        avatar_url,
        introduce,
        social_links
      ),
      tags (
        name
      )
    `)
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

  // コメントを取得
  const { data: commentsData } = await supabase.rpc(
    'get_blog_comments_with_replies',
    { blog_uuid: blogId }
  )

  // いいね数をブログデータに追加
  const blogWithLikes = {
    ...blogData,
    likes_count: likesCountData || 0
  }

  // ログインユーザーがブログ作成者かどうか
  const isMyBlog = user?.id === blogData.user_id

  return (
    <BlogDetail 
      blog={blogWithLikes} 
      isMyBlog={isMyBlog} 
      currentUserId={user?.id} 
      initialComments={commentsData || []}
    />
  )
}

export default BlogDetailPage