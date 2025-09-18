import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import BlogItem from "@/components/blog/BlogItem"
import { Session } from "@supabase/supabase-js"
import LandingPage from "@/components/landing/LandingPage"

const MainPage = async () => {
  const supabase = createClient()

  // ユーザーセッションを取得
  const { data: { session } } = await supabase.auth.getSession()

  // 認証されていない場合、未認証のホームページを表示
  if (!session) {
    return <LandingPage />
  }

  return <BlogContent session={session} />
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "例のヤツ｜ブログ"
  const description = "例のヤツを主催とした様々なことを投稿・共有するためのブログサイトです。"
  const image = `${process.env.NEXT_PUBLIC_APP_URL || ""}/og-image.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: process.env.NEXT_PUBLIC_APP_URL || undefined,
      images: [{ url: image, alt: title }],
      siteName: "例のヤツ｜ブログ",
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [image],
    },
  }
}

// ブログコンテンツを別コンポーネントとして分離して、データフェッチングとレンダリングを分離
const BlogContent = async ({ }: { session: Session }) => {
  const supabase = createClient()
  
  // ブログ一覧を取得
  const { data: blogsData, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles (
        id,
        name,
        avatar_url
      )
    `
    )
    .order("created_at", { ascending: false })

  // 各ブログのいいね数を取得
  const blogsWithLikes = await Promise.all(
    (blogsData || []).map(async (blog) => {
      const { data: likesCount } = await supabase.rpc(
        'get_blog_likes_count',
        { blog_id: blog.id }
      )
      
      return {
        ...blog,
        likes_count: likesCount || 0
      }
    })
  )

  // ブログデータがない場合のメッセージ
  if (!blogsWithLikes.length || error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          まだブログ投稿がありません
        </h2>
        <Link href="/blog/new">
          <Button>
            最初のブログを投稿する
          </Button>
        </Link>
      </div>
    )
  }

  // ブログ一覧表示
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">最新のブログ記事</h1>
        <Link href="/blog/new">
          <Button>
            新規ブログ投稿
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {blogsWithLikes.map((blog) => (
          <BlogItem key={blog.id} blog={blog} />
        ))}
      </div>
    </div>
  )
}

export default MainPage