import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BlogItem from "@/components/blog/BlogItem"
import LandingPage from "@/components/landing/LandingPage"
import { TrendingUp, Search, PenSquare, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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

  if (!session) {
    return <LandingPage />
  }

  return <BlogContent searchParams={searchParams} />
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const { q } = await searchParams
  const query = typeof q === "string" ? q : ""
  const title = query ? `"${query}" の検索結果 | 例のヤツ｜ブログ` : "例のヤツ｜ブログ"
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

const BlogContent = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const supabase = createClient()
  const resolvedSearchParams = await searchParams
  const page = typeof resolvedSearchParams.page === "string" ? Number(resolvedSearchParams.page) : 1
  const queryParam = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : ""
  
  const start = (page - 1) * DEFAULT_PAGE_SIZE
  const end = start + DEFAULT_PAGE_SIZE - 1
  
  let supabaseQuery = supabase
    .from("blogs")
    .select(
      `
      *,
      profiles (
        id,
        name,
        avatar_url
      ),
      tags (
        name
      )
    `,
      { count: "exact" }
    )

  if (queryParam) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${queryParam}%,content.ilike.%${queryParam}%`)
  }

  const [{ data: blogsData, error, count }, { data: tags, error: tagsError }] = await Promise.all([
    supabaseQuery
      .order("created_at", { ascending: false })
      .range(start, end),
    supabase.rpc('get_tags_with_counts')
  ])

  if (tagsError) {
    console.error("Error fetching tags:", tagsError)
  }

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

  const totalCount = count || 0
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

  // 人気タグ（上位15個）
  const popularTags = tags ? [...tags].sort((a, b) => b.count - a.count).slice(0, 15) : []
  const allTags = tags || []

  return (
    <div className="min-h-screen bg-[#f5f6f6] dark:bg-background">
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
            <div className="bg-card border border-border rounded-t-lg flex items-center px-1 h-12 mb-[-1px]">
              <Button variant="ghost" size="sm" className="h-full rounded-none border-b-2 border-[hsl(var(--primary))] text-foreground font-bold px-6 hover:bg-transparent">
                最新の投稿
              </Button>
              <Button variant="ghost" size="sm" className="h-full rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground px-6 hover:bg-transparent" disabled>
                トレンド
              </Button>
            </div>

            {/* ブログ一覧フィード */}
            <div className="bg-card border border-border rounded-b-lg overflow-hidden divide-y divide-border shadow-sm">
              {blogsWithLikes.map((blog, index) => (
                <BlogItem key={blog.id} blog={blog} priority={index < 6} />
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious href={{ query: { ...resolvedSearchParams, page: page - 1 } }} />
                      </PaginationItem>
                    )}
                    {getPagination(page, totalPages).map((item, index) => (
                      <PaginationItem key={index}>
                        {item === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href={{ query: { ...resolvedSearchParams, page: item } }}
                            isActive={page === item}
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationNext href={{ query: { ...resolvedSearchParams, page: page + 1 } }} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>

          {/* 右サイドバー */}
          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
            {/* 投稿ボタン - サイドバー */}
            <div className="hidden lg:block">
              <Link href="/blog/new">
                <Button size="lg" className="w-full gap-2 rounded-md h-12 shadow-none bg-primary hover:bg-primary/90 text-primary-foreground border-none font-bold text-lg">
                  <PenSquare className="h-5 w-5" />
                  記事を投稿する
                </Button>
              </Link>
            </div>

            {/* トレンドタグセクション */}
            {popularTags.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h2 className="font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
                    トレンドタグ
                  </h2>
                </div>
                <div className="p-2">
                  <div className="flex flex-col">
                    {popularTags.map((tag: { name: string; count: number }) => (
                      <Link
                        key={tag.name}
                        href={`/tags/${encodeURIComponent(tag.name)}`}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors group"
                      >
                        <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                          #{tag.name}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {tag.count}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {allTags.length > popularTags.length && (
                    <details className="group border-t border-border mt-2">
                      <summary className="flex justify-center p-3 text-xs text-muted-foreground hover:text-primary cursor-pointer list-none">
                        すべてのタグを表示
                        <ChevronDown className="ml-1 h-3 w-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="p-2 grid grid-cols-2 gap-1 animate-in fade-in slide-in-from-top-1">
                        {allTags.slice(15, 40).map((tag: { name: string; count: number }) => (
                          <Link
                            key={tag.name}
                            href={`/tags/${encodeURIComponent(tag.name)}`}
                            className="text-[11px] p-2 hover:bg-muted rounded truncate text-foreground/70"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* ガイド・規約など */}
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Links</h3>
              <nav className="space-y-2">
                <Link href="/guide/markdown" className="block text-sm text-foreground/80 hover:text-primary transition-colors">
                  マークダウンガイド
                </Link>
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
