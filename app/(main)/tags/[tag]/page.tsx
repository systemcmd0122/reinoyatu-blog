import { createClient } from "@/utils/supabase/server"
import BlogItem from "@/components/blog/BlogItem"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface TagPageProps {
  params: {
    tag: string
  }
}

const TagPage = async ({ params }: TagPageProps) => {
  const tagName = decodeURIComponent(params.tag)
  const supabase = createClient()

  // ブログ一覧とタグ一覧を並行して取得
  const [{ data: blogs, error }, { data: tags, error: tagsError }] = await Promise.all([
    supabase
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
      .order("created_at", { ascending: false }),
    supabase.rpc('get_tags_with_counts')
  ]);

  if (error || !blogs) {
    console.error(error)
    notFound()
  }

  if (tagsError) {
    console.error("Error fetching tags:", tagsError);
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          タグ: <span className="text-primary">#{tagName}</span>
        </h1>
      </div>

      {/* タグフィルターUI */}
      {tags && tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 items-center">
            <Link href="/">
              <Badge variant={"secondary"} className="cursor-pointer text-base px-4 py-1.5">
                すべて
              </Badge>
            </Link>
            {tags.map((tag: { name: string; count: number }) => {
              const isActive = tag.name === tagName;
              return (
                <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                  <Badge variant={isActive ? "default" : "secondary"} className="cursor-pointer text-base px-4 py-1.5">
                    {tag.name}
                    <span className="ml-1.5 text-xs opacity-75">{tag.count}</span>
                  </Badge>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {blogs.map((blog, index) => (
            <BlogItem key={blog.id} blog={blog} priority={index < 3} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">記事が見つかりません</h2>
          <p className="text-lg text-muted-foreground">このタグが付いた記事はまだ投稿されていません。</p>
        </div>
      )}
    </div>
  )
}

export default TagPage