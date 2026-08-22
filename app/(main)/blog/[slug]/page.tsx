import { createClient } from "@/utils/supabase/server"
import BlogDetail from "@/components/blog/BlogDetail"
import { Metadata } from "next"
import { getCollectionWithItems } from "@/actions/collection"
import { calculateReadingTime } from "@/utils/blog-helpers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NormalizedArticle } from "@/types/blog-detail"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ArticleJsonLd, BreadcrumbListJsonLd } from "@/components/seo/JsonLd"
import { redirect, notFound } from "next/navigation"

interface BlogDetailPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    collection?: string
  }>
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function resolveBlog(slugOrId: string) {
  const supabase = createClient()
  const isUuid = uuidRegex.test(slugOrId)

  let query = supabase
    .from("blogs")
    .select("id, slug")
    .eq("is_published", true)

  if (isUuid) {
    query = query.eq("id", slugOrId)
  } else {
    query = query.eq("slug", slugOrId)
  }

  const { data } = await query.single()
  return data
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  if (!slug || slug === "undefined") {
    return {
      title: "記事が見つかりません",
      description: "指定された記事は見つかりませんでした。",
    }
  }

  const supabase = createClient()
  const isUuid = uuidRegex.test(slug)

  let blogQuery = supabase
    .from("blogs")
    .select(`
      id,
      slug,
      title,
      content,
      meta_description,
      image_url,
      created_at,
      profiles!user_id (
        name
      )
    `)

  if (isUuid) {
    blogQuery = blogQuery.eq("id", slug)
  } else {
    blogQuery = blogQuery.eq("slug", slug)
  }

  const { data: blogData } = await blogQuery.single()

  if (!blogData) {
    return {
      title: "記事が見つかりません",
      description: "指定された記事は見つかりませんでした。",
    }
  }

  // いいね数を取得
  const { data: likesCount } = await supabase.rpc('get_blog_likes_count', { blog_id: blogData.id })

  const title = blogData.title || "無題の投稿"

  // meta_description が設定されていればそれを使用、なければ自動生成
  let description: string
  if (blogData.meta_description) {
    description = blogData.meta_description
  } else {
    const raw = blogData.content || ""
    description = raw
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/[#_*`>\[\]()!~^|\\-]/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160)
  }

  const displaySlug = blogData.slug || blogData.id
  const readingMinutes = calculateReadingTime(blogData.content || "")
  const ogParams = new URLSearchParams({
    title,
    author: (blogData.profiles as any)?.name || "",
  })
  if (blogData.image_url) ogParams.set("image", blogData.image_url)
  if ((blogData.profiles as any)?.avatar_url) ogParams.set("avatar", (blogData.profiles as any).avatar_url)
  if (likesCount && likesCount > 0) ogParams.set("likes", String(likesCount))
  if (readingMinutes > 0) ogParams.set("readingTime", String(readingMinutes))
  const image = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/og?${ogParams.toString()}`
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/blog/${displaySlug}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
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
  const { slug } = await params
  const { collection: collectionId } = await searchParams

  if (!slug || slug === "undefined") {
    notFound()
  }

  const supabase = createClient()
  const isUuid = uuidRegex.test(slug)

  // slugがUUIDの場合、スラッグURLにリダイレクト
  if (isUuid) {
    const resolved = await resolveBlog(slug)
    if (resolved?.slug) {
      redirect(`/blog/${resolved.slug}`)
    }
  }

  try {
    // 記事を取得（slug または id で検索）
    let blogQuery = supabase
      .from("blogs")
      .select(`
        *,
        profiles!user_id (
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
          profiles!user_id (
            id,
            name,
            avatar_url
          )
        )
      `)

    if (isUuid) {
      blogQuery = blogQuery.eq("id", slug)
    } else {
      blogQuery = blogQuery.eq("slug", slug)
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user ?? null

    const [blogResult, likesResult, commentsResult, collectionResult] = await Promise.all([
      blogQuery.single(),
      // いいね数・コメントは記事IDが得られてから取得するため、一旦保留
      Promise.resolve({ data: 0 }),
      Promise.resolve({ data: [] }),
      collectionId ? getCollectionWithItems(collectionId) : Promise.resolve(null),
    ])

    const { data: blogData, error: blogError } = blogResult
    const blogId = blogData?.id

    if (blogError || !blogData) {
      notFound()
    }

    // いいね数・コメントを記事IDで並列取得 + 前後の記事
    const [likesResultData, commentsResultData, prevBlogResult, nextBlogResult] = await Promise.all([
      supabase.rpc('get_blog_likes_count', { blog_id: blogId }),
      supabase.rpc('get_blog_comments_v2', { blog_uuid: blogId }),
      // 前の記事（この記事より前に公開された最新の記事）
      supabase
        .from("blogs")
        .select("id, slug, title, image_url, created_at, profiles!user_id (name)")
        .eq("is_published", true)
        .lt("created_at", blogData.created_at)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // 次の記事（この記事より後に公開された最も古い記事）
      supabase
        .from("blogs")
        .select("id, slug, title, image_url, created_at, profiles!user_id (name)")
        .eq("is_published", true)
        .gt("created_at", blogData.created_at)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    const likesCountData = likesResultData.data
    const commentsData = commentsResultData.data
    const collectionData = collectionResult ?? null

    const isMyBlog = user?.id === blogData.user_id ||
      blogData.article_authors?.some((aa: any) => aa.user_id === user?.id)

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
      reading_time: calculateReadingTime(blogData.content || ""),
      likes_count: likesCountData || 0,
      view_count: blogData.view_count || 0,
      is_published: blogData.is_published,
      user_id: blogData.user_id,
    }

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

    const title = blogData.title || "無題の投稿"
    const displaySlug = blogData.slug || blogData.id
    const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/blog/${displaySlug}`

    // meta_description が設定されていればそれを使用、なければ自動生成
    const articleDescription = blogData.meta_description || (blogData.content || "").slice(0, 160)

    // 読了時間を ISO 8601 形式に変換（例: PT5M）
    const readingMinutes = calculateReadingTime(blogData.content || "")
    const timeRequired = readingMinutes > 0 ? `PT${readingMinutes}M` : undefined

    return (
      <>
        <ArticleJsonLd
          title={title}
          description={articleDescription}
          url={url}
          image={blogData.image_url || undefined}
          datePublished={blogData.created_at}
          dateModified={blogData.updated_at || undefined}
          authorName={(blogData.profiles as any)?.name || ""}
          authorUrl={`${process.env.NEXT_PUBLIC_APP_URL || ""}/profile/${blogData.user_id}`}
          tags={blogData.tags?.map((t: any) => t.name) || []}
          timeRequired={timeRequired}
        />
        <BreadcrumbListJsonLd
          items={[
            { name: "ホーム", url: process.env.NEXT_PUBLIC_APP_URL || "" },
            { name: title, url },
          ]}
        />
        <BlogDetail
          blog={normalizedBlog}
          isMyBlog={isMyBlog}
          currentUserId={user?.id}
          initialComments={commentsData || []}
          collection={collectionData}
          prevBlog={prevBlogResult?.data ? {
            slug: prevBlogResult.data.slug || prevBlogResult.data.id,
            title: prevBlogResult.data.title,
            image_url: prevBlogResult.data.image_url,
            author_name: (prevBlogResult.data.profiles as any)?.name,
          } : null}
          nextBlog={nextBlogResult?.data ? {
            slug: nextBlogResult.data.slug || nextBlogResult.data.id,
            title: nextBlogResult.data.title,
            image_url: nextBlogResult.data.image_url,
            author_name: (nextBlogResult.data.profiles as any)?.name,
          } : null}
        />
      </>
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
