import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BlogItem from "@/components/blog/BlogItem"
import LandingPage from "@/components/landing/LandingPage"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const DEFAULT_PAGE_SIZE = 9 // 1ページあたりの表示件数

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

  // ユーザーセッションを取得
  const { data: { session } } = await supabase.auth.getSession()

  // 認証されていない場合、未認証のホームページを表示
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

// ブログコンテンツを別コンポーネントとして分離して、データフェッチングとレンダリングを分離
const BlogContent = async ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const supabase = createClient()
  const currentTag = null // どのタグも選択されていない状態を定義
  const page = typeof searchParams.page === "string" ? Number(searchParams.page) : 1
  const start = (page - 1) * DEFAULT_PAGE_SIZE
  const end = start + DEFAULT_PAGE_SIZE - 1
  
  // ブログ一覧とタグ一覧を並行して取得
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
  ]);

  if (tagsError) {
    console.error("Error fetching tags:", tagsError);
  }

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

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / DEFAULT_PAGE_SIZE)

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
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">最新のブログ記事</h1>
                <Link href="/blog/new">
          <Button>新規ブログ投稿</Button>
        </Link>
      </div>

      {/* タグフィルターUI */}
      {tags && tags.length > 0 && (
        <div className="relative mb-8">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-4">
              <Link href="/">
                <Badge variant={!currentTag ? "default" : "secondary"} className="cursor-pointer text-base px-4 py-1.5">
                  すべて
                </Badge>
              </Link>
              {tags.map((tag: { name: string; count: number }) => (
                <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                  <Badge variant={currentTag === tag.name ? "default" : "secondary"} className="cursor-pointer text-base px-4 py-1.5">
                    {tag.name}
                    <span className="ml-1.5 text-xs opacity-75">{tag.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* ブログ一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {blogsWithLikes.map((blog, index) => (
          <BlogItem key={blog.id} blog={blog} priority={index < 3} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-8">
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
                  <PaginationLink href={{ query: { page: item } }} isActive={page === item}>
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
      )}
    </div>
  )
}

export default MainPage