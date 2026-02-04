import { createClient } from "@/utils/supabase/server"
import BlogItem from "@/components/blog/BlogItem"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tag, TrendingUp, Grid3x3, List, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TagPageProps {
  params: Promise<{
    tag: string
  }>
  searchParams: Promise<{
    sort?: string
    view?: string
  }>
}

const TagPage = async ({ params, searchParams }: TagPageProps) => {
  const { tag } = await params
  const { sort, view } = await searchParams
  const tagName = decodeURIComponent(tag)
  const sortBy = sort || 'latest'
  const viewMode = view || 'grid'
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
      )
    `)
    .eq("tags.name", tagName)

  // ソート条件の適用
  switch (sortBy) {
    case 'oldest':
      query = query.order("created_at", { ascending: true })
      break
    case 'title':
      query = query.order("title", { ascending: true })
      break
    case 'latest':
    default:
      query = query.order("created_at", { ascending: false })
      break
  }

  // データ取得
  const [{ data: blogs, error }, { data: tags, error: tagsError }] = await Promise.all([
    query,
    supabase.rpc('get_tags_with_counts')
  ])

  if (error || !blogs) {
    console.error(error)
    notFound()
  }

  if (tagsError) {
    console.error("Error fetching tags:", tagsError)
  }

  // 人気タグ（記事数が多い順）
  const popularTags = tags ? [...tags].sort((a, b) => b.count - a.count).slice(0, 10) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダーセクション */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group">
            <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            ホームに戻る
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="p-4 bg-primary/10 rounded-2xl shadow-inner">
              <Tag className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                <span className="text-primary">#{tagName}</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-muted-foreground text-lg">
                  {blogs.length}件の記事が見つかりました
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* タグフィルターセクション */}
        {tags && tags.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                人気のタグ
              </h2>
            </div>
            
            {/* タグ一覧 - スクロール可能 */}
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <Link href="/">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer text-sm px-4 py-2 whitespace-nowrap hover:bg-primary/10 transition-colors border-2"
                  >
                    すべて
                  </Badge>
                </Link>
                {popularTags.map((tag: { name: string; count: number }) => {
                  const isActive = tag.name === tagName
                  return (
                    <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                      <Badge 
                        variant={isActive ? "default" : "outline"} 
                        className={`cursor-pointer text-sm px-4 py-2 whitespace-nowrap transition-all ${
                          isActive 
                            ? 'shadow-md scale-105' 
                            : 'hover:bg-primary/10 border-2'
                        }`}
                      >
                        {tag.name}
                        <span className={`ml-2 text-xs ${isActive ? 'opacity-90' : 'opacity-60'}`}>
                          {tag.count}
                        </span>
                      </Badge>
                    </Link>
                  )
                })}
              </div>
              {/* グラデーション効果 */}
              <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            </div>

            {/* 全タグ表示（折りたたみ可能） */}
            {tags.length > 10 && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
                  <span>すべてのタグを表示 ({tags.length}個)</span>
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag: { name: string; count: number }) => {
                    const isActive = tag.name === tagName
                    return (
                      <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                        <Badge 
                          variant={isActive ? "default" : "secondary"} 
                          className="cursor-pointer text-xs px-3 py-1 hover:scale-105 transition-transform"
                        >
                          {tag.name}
                          <span className="ml-1.5 opacity-75">{tag.count}</span>
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}
          </div>
        )}

        {/* コントロールバー */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card text-card-foreground rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">表示:</span>
            <Tabs defaultValue={viewMode} className="w-auto">
              <TabsList>
                <Link href={`/tags/${encodeURIComponent(tagName)}?sort=${sortBy}&view=grid`}>
                  <TabsTrigger value="grid" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    <span className="hidden sm:inline">グリッド</span>
                  </TabsTrigger>
                </Link>
                <Link href={`/tags/${encodeURIComponent(tagName)}?sort=${sortBy}&view=list`}>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">リスト</span>
                  </TabsTrigger>
                </Link>
              </TabsList>
            </Tabs>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                並び替え: {sortBy === 'latest' ? '最新順' : sortBy === 'oldest' ? '古い順' : 'タイトル順'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>並び替え</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy}>
                <Link href={`/tags/${encodeURIComponent(tagName)}?sort=latest&view=${viewMode}`}>
                  <DropdownMenuRadioItem value="latest">
                    最新順
                  </DropdownMenuRadioItem>
                </Link>
                <Link href={`/tags/${encodeURIComponent(tagName)}?sort=oldest&view=${viewMode}`}>
                  <DropdownMenuRadioItem value="oldest">
                    古い順
                  </DropdownMenuRadioItem>
                </Link>
                <Link href={`/tags/${encodeURIComponent(tagName)}?sort=title&view=${viewMode}`}>
                  <DropdownMenuRadioItem value="title">
                    タイトル順
                  </DropdownMenuRadioItem>
                </Link>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ブログ一覧 */}
        {blogs.length > 0 ? (
          <div className={
            viewMode === 'list' 
              ? "space-y-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          }>
            {blogs.map((blog, index) => (
              <BlogItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-6">
              <Tag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">記事が見つかりません</h2>
            <p className="text-lg text-muted-foreground mb-6">
              このタグが付いた記事はまだ投稿されていません。
            </p>
            <Link href="/">
              <Button variant="outline" size="lg">
                ホームに戻る
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default TagPage