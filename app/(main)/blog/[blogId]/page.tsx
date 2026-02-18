import { createClient } from "@/utils/supabase/server"
import BlogDetail from "@/components/blog/BlogDetail"
import { Metadata } from "next"
import { getCollectionWithItems } from "@/actions/collection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NormalizedArticle } from "@/types/blog-detail"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface BlogDetailPageProps {
  params: Promise<{
    blogId: string
  }>
  searchParams: Promise<{
    collection?: string
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

  const image = blogData.image_url || `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/og?title=${encodeURIComponent(title)}&author=${encodeURIComponent((blogData.profiles as any)?.name || "")}`
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

const BlogDetailPage = async ({ params, searchParams }: BlogDetailPageProps) => {
  const { blogId } = await params
  const { collection: collectionId } = await searchParams

  if (!blogId || blogId === "undefined" || !uuidRegex.test(blogId)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">不正なリクエストです</h2>
        <Link href="/">
          <Button variant="outline">トップページに戻る</Button>
        </Link>
      </div>
    )
  }

  const supabase = createClient()

  try {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    // ブログ詳細取得
    const { data: blogData, error: blogError } = await supabase
      .from("blogs")
      .select(`
        *,
        profiles (
          id,
          name,
          avatar_url,
          introduce,
          homepage_url,
          social_links
        ),
        tags (
          name
        ),
        article_authors (
          user_id,
          role,
          profiles (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq("id", blogId)
      .single()

    if (blogError || !blogData) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
          <Alert variant="destructive" className="max-w-md text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>記事が見つかりません</AlertTitle>
            <AlertDescription>
              指定された記事は削除されたか、URLが間違っている可能性があります。
            </AlertDescription>
          </Alert>
          <Link href="/" className="mt-8">
            <Button variant="outline">トップページに戻る</Button>
          </Link>
        </div>
      )
    }

    // いいね数を取得
    const { data: likesCountData } = await supabase.rpc(
      'get_blog_likes_count',
      { blog_id: blogId }
    )

    // コメントを取得 (V2: リアクション同梱)
    const { data: commentsData } = await supabase.rpc(
      'get_blog_comments_v2',
      { blog_uuid: blogId }
    )

    // ログインユーザーがブログ作成者かどうか
    const isMyBlog = user?.id === blogData.user_id

    // データの正規化
    const normalizedBlog: NormalizedArticle = {
      id: blogData.id,
      title: blogData.title,
      content: blogData.content,
      tags: blogData.tags?.map((t: any) => t.name) || [],
      cover_image_url: blogData.image_url,
      ai_summary: blogData.summary,
      author: {
        id: blogData.profiles?.id,
        name: blogData.profiles?.name,
        avatar_url: blogData.profiles?.avatar_url,
        introduce: blogData.profiles?.introduce,
        homepage_url: blogData.profiles?.homepage_url,
        social_links: blogData.profiles?.social_links,
      },
      authors: blogData.article_authors?.map((aa: any) => ({
        id: aa.profiles?.id,
        name: aa.profiles?.name,
        avatar_url: aa.profiles?.avatar_url,
        role: aa.role,
      })) || [{
        id: blogData.profiles?.id,
        name: blogData.profiles?.name,
        avatar_url: blogData.profiles?.avatar_url,
        role: 'owner',
      }],
      created_at: blogData.created_at,
      updated_at: blogData.updated_at,
      reading_time: Math.ceil((blogData.content?.length || 0) / 400) || 1,
      likes_count: likesCountData || 0,
      is_published: blogData.is_published,
      user_id: blogData.user_id,
    }

    // コレクション情報の取得（もし指定されていれば）
    let collectionData = null
    if (collectionId) {
      collectionData = await getCollectionWithItems(collectionId)
    }

    // 非公開記事の権限チェック
    if (!blogData.is_published && !isMyBlog) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">この記事は非公開です</h2>
          <p className="text-muted-foreground mb-8">お探しの記事は現在下書き保存されているか、公開されていません。</p>
          <Link href="/">
            <Button variant="outline">トップページに戻る</Button>
          </Link>
        </div>
      )
    }

    return (
      <BlogDetail 
        blog={normalizedBlog} 
        isMyBlog={isMyBlog} 
        currentUserId={user?.id} 
        initialComments={commentsData || []}
        collection={collectionData}
      />
    )
  } catch (error) {
    console.error("記事取得エラー:", error)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
        <Alert variant="destructive" className="max-w-md text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>
            データの読み込み中に予期しないエラーが発生しました。時間をおいて再度お試しください。
          </AlertDescription>
        </Alert>
        <Link href="/" className="mt-8">
          <Button variant="outline">トップページに戻る</Button>
        </Link>
      </div>
    )
  }
}

export default BlogDetailPage