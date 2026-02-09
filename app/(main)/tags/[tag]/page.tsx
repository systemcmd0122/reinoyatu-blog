import { createClient } from "@/utils/supabase/server"
import BlogListView from "@/components/blog/BlogListView"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tag, TrendingUp, ChevronLeft, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TagPageProps {
  params: Promise<{
    tag: string
  }>
  searchParams: Promise<{
    sort?: string
  }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const tagName = decodeURIComponent(tag)
  const title = `#${tagName}`
  const description = `「#${tagName}」タグが付いた記事の一覧です。例のヤツ｜ブログで最新の情報をチェックしましょう。`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | 例のヤツ｜ブログ`,
      description,
      type: "website",
    },
    twitter: {
      title: `${title} | 例のヤツ｜ブログ`,
      description,
      card: "summary",
    },
  }
}

const TagPage = async ({ params, searchParams }: TagPageProps) => {
  const { tag } = await params
  const { sort } = await searchParams
  const tagName = decodeURIComponent(tag)
  const sortBy = sort || 'latest'
  const supabase = createClient()

  // ブログ一覧取得のクエリ
  let query = supabase
    .from("blogs")
    .select(`
      *,
      profiles (
        id,
        name,
        avatar_url
      ),
      tags!inner (
        name
      ),
      likes:likes(count)
    `)
    .eq("tags.name", tagName)

  // ソート条件の適用
  switch (sortBy) {
    case 'oldest':
      query = query.order("created_at", { ascending: true })
      break
    case 'latest':
    default:
      query = query.order("created_at", { ascending: false })
      break
  }

  // データ取得
  const [{ data: blogs, error }, { data: allTagsData }] = await Promise.all([
    query,
    supabase.rpc('get_tags_with_counts')
  ])

  if (error || !blogs) {
    console.error(error)
    notFound()
  }

  const blogsWithLikes = (blogs || []).map((blog: any) => ({
    ...blog,
    likes_count: blog.likes?.[0]?.count || 0
  }))

  // 人気タグ
  const popularTags = allTagsData ? [...allTagsData].sort((a, b) => b.count - a.count).slice(0, 20) : []

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* メインコンテンツ - フィード */}
          <main className="flex-1 min-w-0">
            {/* ヘッダー */}
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors group">
                <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                トップに戻る
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg">
                  <Tag className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-foreground">
                    #{tagName}
                  </h1>
                  <p className="text-muted-foreground font-medium">
                    {blogs.length}件の投稿
                  </p>
                </div>
              </div>
            </div>

            {/* タブナビゲーション */}
            <div className="bg-card border border-border rounded-t-lg flex items-center px-1 h-12 mb-4">
              <Link href={`/tags/${tag}?sort=latest`} className="h-full">
                <Button variant="ghost" size="sm" className={`h-full rounded-none border-b-2 px-6 hover:bg-transparent ${sortBy === 'latest' ? 'border-primary text-foreground font-bold' : 'border-transparent text-muted-foreground'}`}>
                  最新の投稿
                </Button>
              </Link>
              <Link href={`/tags/${tag}?sort=oldest`} className="h-full">
                <Button variant="ghost" size="sm" className={`h-full rounded-none border-b-2 px-6 hover:bg-transparent ${sortBy === 'oldest' ? 'border-primary text-foreground font-bold' : 'border-transparent text-muted-foreground'}`}>
                  古い順
                </Button>
              </Link>
            </div>

            {/* ブログ一覧 */}
            {blogsWithLikes.length > 0 ? (
              <BlogListView blogs={blogsWithLikes} />
            ) : (
              <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground shadow-sm">
                このタグに関連する記事はまだありません。
              </div>
            )}
          </main>

          {/* 右サイドバー */}
          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
            {/* 他のタグ */}
            {popularTags.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h2 className="font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    トレンドタグ
                  </h2>
                </div>
                <div className="p-2">
                  <div className="flex flex-wrap gap-1 p-2">
                    {popularTags.map((t: { name: string; count: number }) => (
                      <Link 
                        key={t.name} 
                        href={`/tags/${encodeURIComponent(t.name)}`}
                      >
                        <Badge 
                          variant={t.name === tagName ? "default" : "secondary"}
                          className={cn(
                            "rounded-full px-3 py-1 cursor-pointer transition-all",
                            t.name === tagName ? "bg-primary hover:bg-primary/90" : "hover:bg-muted-foreground/10"
                          )}
                        >
                          #{t.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">About Tag</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                #{tagName} タグがついた記事の一覧です。興味のあるトピックをフォローして最新情報をチェックしましょう。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default TagPage
