import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Metadata } from "next"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BlogListView from "@/components/blog/BlogListView"
import LandingPage from "@/components/landing/LandingPage"
import { Search, PenSquare } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { WebSiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd"
import { FeedSidebar } from "@/components/feed/FeedSidebar"

const DEFAULT_PAGE_SIZE = 9

const getPagination = (page: number, totalPages: number) => {
  const delta = 1
  const left = page - delta
  const right = page + delta + 1
  const range = []
  const rangeWithDots: (number | string)[] = []
  let l: number | undefined

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
}

const MainPage = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  return (
    <>
      <WebSiteJsonLd
        name="例のヤツ｜ブログ"
        url={baseUrl}
        searchUrl={`${baseUrl}/?q={search_term_string}`}
      />
      <OrganizationJsonLd
        name="例のヤツ｜ブログ"
        url={baseUrl}
      />
      {!session && <LandingPage />}
      <BlogContent searchParams={searchParams} />
    </>
  )
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q : ""
  const page = typeof pageParam === "string" ? Number(pageParam) : 1
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  // クエリがない場合はタイトルを返さず、ルートレイアウトのデフォルトを使用させる
  if (!query) {
    return {
      title: undefined,
      alternates: {
        canonical: page > 1 ? `${baseUrl}/?page=${page}` : baseUrl,
      },
    }
  }

  const title = `"${query}" の検索結果`
  const description = `「${query}」の検索結果一覧です。例のヤツ｜ブログで興味のある記事を見つけましょう。`
  const image = `${baseUrl}/api/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    robots: "noindex, follow",
    alternates: {
      canonical: `${baseUrl}/?q=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ""}`,
    },
    openGraph: {
      title,
      description,
      url: baseUrl || undefined,
      images: [{ url: image, alt: title }],
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

const BlogContent = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const supabase = createClient()
  const resolvedSearchParams = await searchParams
  const page = typeof resolvedSearchParams.page === "string" ? Number(resolvedSearchParams.page) : 1
  const queryParam = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""
  const sortParam = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : "latest"
  const sort = sortParam === "popular" ? "popular" : "latest"

  const start = (page - 1) * DEFAULT_PAGE_SIZE
  const end = start + DEFAULT_PAGE_SIZE - 1

  let supabaseQuery = supabase
    .from("blogs")
    .select(
      `
      *,
      profiles!user_id (
        id,
        name,
        avatar_url
      ),
      tags (
        name
      ),
      likes:likes(count)
    `,
      { count: "exact" }
    )
    .eq("is_published", true)

  if (queryParam) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${queryParam}%,content.ilike.%${queryParam}%`)
  }

  // ソート適用
  if (sort === "popular") {
    // 人気順: いいね数降順（加重スコアはクエリ後にソート）
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
  } else {
    // 最新順
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false })
  }

  // 記事一覧とタグのみ取得（サイドバーは Suspense で別コンポーネントに委譲）
  const [blogsResult, tagsResult] = await Promise.all([
    supabaseQuery
      .range(0, sort === "popular" ? 200 : end),
    supabase.rpc('get_tags_with_counts'),
  ])

  const { data: blogsData, error, count } = blogsResult
  const { data: tags, error: tagsError } = tagsResult

  if (tagsError) {
    console.error("Error fetching tags:", tagsError)
  }

  const blogsWithLikes = (blogsData || []).map((blog: any) => ({
    ...blog,
    likes_count: blog.likes?.[0]?.count || 0
  }))

  // 人気順: 加重スコアでソート（いいね×3 + 閲覧数×1 + 鮜度ボーナス）
  let sortedBlogs = blogsWithLikes
  if (sort === "popular") {
    const now = Date.now()
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
    sortedBlogs = [...blogsWithLikes]
      .map((blog) => {
        const age = now - new Date(blog.created_at).getTime()
        const recencyBonus = Math.max(0, 1 - age / THIRTY_DAYS) * 50
        const score = (blog.likes_count || 0) * 3 + (blog.view_count || 0) * 1 + recencyBonus
        return { ...blog, _score: score }
      })
      .sort((a, b) => b._score - a._score)
      .slice(start, end)
  } else {
    sortedBlogs = blogsWithLikes.slice(start, end)
  }

  const totalCount = sort === "popular" ? blogsWithLikes.length : (count || 0)
  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE)

  if (!blogsWithLikes.length || error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-muted rounded-full mb-6">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-foreground">
          {queryParam ? `"${queryParam}" に一致する記事は見つかりませんでした` : "まだブログ投稿がありません"}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          {queryParam
            ? "キーワードを変えて検索するか、トップページに戻ってみてください。"
            : "最初のブログ記事を投稿して、あなたのストーリーを共有しましょう！"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {queryParam ? (
            <Link href="/">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                すべての記事を表示
              </Button>
            </Link>
          ) : (
            <Link href="/blog/new">
              <Button size="lg" className="rounded-full px-8 shadow-md">
                最初のブログを投稿する
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* メインコンテンツ - フィード */}
          <main className="flex-1 min-w-0">
            {queryParam && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                  <Search className="h-6 w-6" />
                  <span>&ldquo;{queryParam}&rdquo; の検索結果</span>
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {totalCount}件
                  </span>
                </h1>
                <Link href="/" className="text-sm text-primary hover:underline mt-1 inline-block">
                  検索をクリア
                </Link>
              </div>
            )}

            {/* タブナビゲーション */}
            <div className="flex items-center gap-1 mb-6 border-b border-border/50">
              <Link href={{ pathname: "/", query: { ...resolvedSearchParams, sort: "latest", page: 1 } }}>
                <Button variant="ghost" size="sm" className={`rounded-none border-b-2 ${sort === "latest" ? "border-primary text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground"} px-4 h-10 hover:bg-transparent transition-none`}>
                  最新の投稿
                </Button>
              </Link>
              <Link href={{ pathname: "/", query: { ...resolvedSearchParams, sort: "popular", page: 1 } }}>
                <Button variant="ghost" size="sm" className={`rounded-none border-b-2 ${sort === "popular" ? "border-primary text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground"} px-4 h-10 hover:bg-transparent transition-none`}>
                  人気順
                </Button>
              </Link>
            </div>

            {/* ブログ一覧 */}
            <BlogListView blogs={sortedBlogs} />

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious href={{ pathname: "/", query: { ...resolvedSearchParams, page: page - 1 } }} />
                      </PaginationItem>
                    )}
                    {getPagination(page, totalPages).map((item, index) => (
                      <PaginationItem key={index}>
                        {item === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href={{ pathname: "/", query: { ...resolvedSearchParams, page: item } }}
                            isActive={page === item}
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationNext href={{ pathname: "/", query: { ...resolvedSearchParams, page: page + 1 } }} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>

          {/* 右サイドバー */}
          <aside className="w-full lg:w-[300px] flex-shrink-0">
            {/* 投稿ボタン - サイドバー（即表示） */}
            <div className="hidden lg:block mb-6">
              <Link href="/blog/new">
                <Button size="lg" className="w-full gap-2 rounded-lg h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground border-none font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <PenSquare className="h-5 w-5" />
                  記事を投稿する
                </Button>
              </Link>
            </div>

            {/* サイドバー内容（ストリーミング） */}
            <Suspense fallback={
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="p-4 border-b border-border bg-muted/30">
                      <div className="h-4 bg-muted rounded w-24" />
                    </div>
                    <div className="p-2 space-y-3">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="p-3">
                          <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-2 bg-muted rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }>
              <FeedSidebar />
            </Suspense>

            {/* ガイド・規約など */}
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm mt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">リンク</h3>
              <nav className="space-y-2">
                <Link href="/privacy" className="block text-sm text-foreground/80 hover:text-primary transition-colors">
                  プライバシーポリシー
                </Link>
              </nav>
              <div className="mt-4 pt-4 border-t border-border text-[10px] text-muted-foreground">
                © {new Date().getFullYear()} 例のヤツ｜ブログ
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default MainPage
