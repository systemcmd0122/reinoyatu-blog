import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BlogItem from "@/components/blog/BlogItem"
import LandingPage from "@/components/landing/LandingPage"
import { TrendingUp, Filter } from "lucide-react"
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

const MainPage = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <LandingPage />
  }

  return <BlogContent searchParams={searchParams} />
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

const BlogContent = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const supabase = createClient()
  const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
  const start = (page - 1) * DEFAULT_PAGE_SIZE
  const end = start + DEFAULT_PAGE_SIZE - 1
  
  const [{ data: blogsData, error, count }, { data: tags, error: tagsError }] = await Promise.all([
    supabase
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
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          まだブログ投稿がありません
        </h2>
        <Link href="/blog/new">
          <Button>最初のブログを投稿する</Button>
        </Link>
      </div>
    )
  }

  // 人気タグ（上位15個）
  const popularTags = tags ? [...tags].sort((a, b) => b.count - a.count).slice(0, 15) : []
  const allTags = tags || []

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダーセクション */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              最新のブログ記事
            </h1>
            <p className="text-muted-foreground">
              {totalCount}件の記事が投稿されています
            </p>
          </div>
          
          <Link href="/blog/new">
            <Button size="lg" className="gap-2">
              新規ブログ投稿
            </Button>
          </Link>
        </div>

        {/* タグフィルターセクション */}
        {popularTags.length > 0 && (
          <div className="mb-8 bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">人気のタグ</h2>
              <Badge variant="secondary" className="ml-auto">
                {allTags.length}個
              </Badge>
            </div>
            
            {/* 人気タグ一覧 - スクロール可能 */}
            <div className="relative mb-4">
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <Badge 
                  variant="default" 
                  className="cursor-default text-sm px-5 py-2.5 whitespace-nowrap shadow-md flex-shrink-0 font-medium"
                >
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  すべて
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                </Badge>
                {popularTags.map((tag: { name: string; count: number }) => (
                  <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer text-sm px-5 py-2.5 whitespace-nowrap hover:bg-primary/10 hover:border-primary/50 transition-all border-2 flex-shrink-0 font-medium group"
                    >
                      <span className="group-hover:text-primary transition-colors">
                        {tag.name}
                      </span>
                      <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full opacity-75 group-hover:bg-primary/20 transition-colors">
                        {tag.count}
                      </span>
                    </Badge>
                  </Link>
                ))}
              </div>
              {/* グラデーション効果 */}
              <div className="absolute right-0 top-0 bottom-3 w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
            </div>

            {/* 全タグ表示（折りたたみ可能） */}
            {allTags.length > 15 && (
              <details className="group mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
                  <span>すべてのタグを表示</span>
                  <Badge variant="secondary" className="text-xs">
                    +{allTags.length - 15}
                  </Badge>
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in-50 duration-300">
                  {allTags.map((tag: { name: string; count: number }) => (
                    <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer text-xs px-3 py-1.5 hover:scale-105 hover:bg-primary/20 transition-all font-medium"
                      >
                        {tag.name}
                        <span className="ml-1.5 opacity-60">{tag.count}</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>
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
                    <PaginationPrevious href={{ query: { page: page - 1 } }} />
                  </PaginationItem>
                )}
                {getPagination(page, totalPages).map((item, index) => (
                  <PaginationItem key={index}>
                    {item === "..." ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink 
                        href={{ query: { page: item } }} 
                        isActive={page === item}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={{ query: { page: page + 1 } }} />
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