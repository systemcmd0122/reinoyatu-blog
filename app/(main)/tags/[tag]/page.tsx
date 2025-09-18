import { createClient } from "@/utils/supabase/server"
import BlogItem from "@/components/blog/BlogItem"
import { notFound } from "next/navigation"
import Link from "next/link"

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
      <h1 className="text-3xl font-bold mb-6">
        タグ: <span className="text-primary"># {tagName}</span>
      </h1>

      {/* タグフィルターUI */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 items-center">
          <Link href="/">
            <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
              すべて
            </span>
          </Link>
          {tags && tags.map((tag: { name: string; count: number }) => {
            const isActive = tag.name === tagName;
            return (
              <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
                <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-200 cursor-pointer ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                  {tag.name} <span className="text-xs opacity-75">({tag.count})</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {blogs.map((blog, index) => (
            <BlogItem key={blog.id} blog={blog} priority={index < 3} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">このタグが付いた記事はまだありません。</p>
        </div>
      )}
    </div>
  )
}

export default TagPage