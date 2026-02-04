import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BlogItem from "@/components/blog/BlogItem"
import LandingPage from "@/components/landing/LandingPage"
import { TrendingUp, Filter, Search, PenSquare, ChevronDown } from "lucide-react"
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダーセクション */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {queryParam ? (
                <span className="flex items-center gap-3">
                  <Search className="h-8 w-8 text-primary" />
                  <span>&ldquo;{queryParam}&rdquo;</span>
                </span>
              ) : (
                "最新のブログ記事"
              )}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-lg">
                {queryParam
                  ? `${totalCount}件の記事が見つかりました`
                  : `${totalCount}件の記事が投稿されています`}
              </p>
              {queryParam && (
                <Link href="/">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs">
                    検索をクリア
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          <Link href="/blog/new">
            <Button size="lg" className="gap-2 rounded-full px-8 shadow-lg hover:shadow-xl transition-all active:scale-95">
              <PenSquare className="h-5 w-5" />
              記事を投稿する
            </Button>
          </Link>
        </div>

        {/* タグフィルターセクション - 刷新版 */}
        {popularTags.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">トレンドタグ</h2>
              </div>
              <Badge variant="outline" className="rounded-full px-4 border-primary/20 text-primary">
                {allTags.length} トピック
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <Link href="/">
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                  !queryParam
                    ? "bg-primary border-primary text-primary-foreground shadow-lg scale-[1.02]"
                    : "bg-card border-border hover:border-primary/50 text-foreground"
                )}>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-bold">すべて</span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    !queryParam ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {totalCount}
                  </span>
                </div>
              </Link>

              {popularTags.map((tag: { name: string; count: number }) => (
                <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                  <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-md transition-all active:scale-95 group">
                    <span className="font-semibold truncate mr-2 group-hover:text-primary transition-colors">
                      #{tag.name}
                    </span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {tag.count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {allTags.length > popularTags.length && (
              <details className="group mt-6">
                <summary className="flex justify-center">
                  <Button variant="ghost" size="sm" className="rounded-full px-8 text-muted-foreground hover:text-foreground list-none cursor-pointer">
                    すべてのタグを表示
                    <ChevronDown className="ml-2 h-4 w-4 transition-transform group-open:rotate-180" />
                  </Button>
                </summary>
                <div className="mt-6 p-6 rounded-2xl bg-muted/30 border border-dashed border-border animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag: { name: string; count: number }) => (
                      <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                        <Badge
                          variant="secondary"
                          className="px-4 py-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                        >
                          {tag.name}
                          <span className="ml-2 opacity-60 text-[10px]">{tag.count}</span>
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </section>
        )}

        {/* ブログ一覧 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {blogsWithLikes.map((blog, index) => (
            <BlogItem key={blog.id} blog={blog} priority={index < 6} />
          ))}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-12">
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
      </div>
    </div>
  )
}

export default MainPage