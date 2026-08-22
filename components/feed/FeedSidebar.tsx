import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { TrendingUp, Eye, List, Hash, Activity, ChevronDown } from "lucide-react"

export async function FeedSidebar() {
  const supabase = createClient()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [tagsResult, popularResult, collectionsResult, trendingResult, recentTagsResult, recentLikesResult, recentCommentsResult] = await Promise.all([
    supabase.rpc('get_tags_with_counts'),
    supabase
      .from("blogs")
      .select(`id, slug, title, view_count, profiles!user_id (name)`)
      .eq("is_published", true)
      .order("view_count", { ascending: false })
      .limit(5),
    supabase
      .from("collections")
      .select(`id, title, profiles!user_id (name)`)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("blogs")
      .select(`
        id, slug, title, image_url, created_at,
        profiles!user_id (name, avatar_url),
        likes(count)
      `)
      .eq("is_published", true)
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("blogs")
      .select("tags")
      .eq("is_published", true)
      .gte("created_at", oneWeekAgo),
    supabase
      .from("likes")
      .select(`
        id, created_at, user_id, blog_id,
        profiles:user_id (name, avatar_url),
        blogs:blog_id (title, slug)
      `)
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("comments")
      .select(`
        id, created_at, user_id, blog_id, content,
        profiles:user_id (name, avatar_url),
        blogs:blog_id (title, slug)
      `)
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const { data: tags } = tagsResult
  const { data: popularBlogs } = popularResult
  const { data: recommendedCollections } = collectionsResult
  const { data: trendingBlogs } = trendingResult
  const { data: recentTagsData } = recentTagsResult
  const { data: recentLikes } = recentLikesResult
  const { data: recentComments } = recentCommentsResult

  const popularTags = tags ? [...tags].sort((a: any, b: any) => b.count - a.count).slice(0, 15) : []
  const allTags = tags || []

  const trendingTagMap = new Map<string, number>()
  for (const blog of (recentTagsData || [])) {
    if (Array.isArray(blog.tags)) {
      for (const tag of blog.tags) {
        trendingTagMap.set(tag, (trendingTagMap.get(tag) || 0) + 1)
      }
    }
  }
  const trendingTags = [...trendingTagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  type ActivityItem = {
    id: string
    type: "like" | "comment"
    created_at: string
    user_name: string
    user_avatar: string | null
    blog_title: string
    blog_slug: string
    comment_preview?: string
  }
  const activities: ActivityItem[] = [
    ...(recentLikes || []).map((like: any) => ({
      id: `like-${like.id}`,
      type: "like" as const,
      created_at: like.created_at,
      user_name: like.profiles?.name || "匿名",
      user_avatar: like.profiles?.avatar_url,
      blog_title: like.blogs?.title || "",
      blog_slug: like.blogs?.slug || like.blog_id,
    })),
    ...(recentComments || []).map((comment: any) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      created_at: comment.created_at,
      user_name: comment.profiles?.name || "匿名",
      user_avatar: comment.profiles?.avatar_url,
      blog_title: comment.blogs?.title || "",
      blog_slug: comment.blogs?.slug || comment.blog_id,
      comment_preview: (comment.content || "").slice(0, 40),
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* 人気の記事 */}
      {popularBlogs && popularBlogs.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              人気の記事
            </h2>
          </div>
          <div className="p-2">
            <div className="flex flex-col">
              {popularBlogs.map((b: any) => (
                <Link
                  key={b.id}
                  href={`/blog/${b.slug || b.id}`}
                  className="flex flex-col p-3 rounded-md hover:bg-muted transition-colors group"
                >
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-all line-clamp-1">
                    {b.title}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      by {b.profiles?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {b.view_count || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 注目の記事 */}
      {trendingBlogs && trendingBlogs.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <span className="text-primary">🔥</span>
              注目の記事
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">直近1週間</p>
          </div>
          <div className="p-2">
            <div className="flex flex-col">
              {trendingBlogs.map((b: any) => {
                const likesCount = b.likes?.[0]?.count || 0
                return (
                  <Link
                    key={b.id}
                    href={`/blog/${b.slug || b.id}`}
                    className="flex items-start gap-3 p-3 rounded-md hover:bg-muted transition-colors group"
                  >
                    {b.image_url && (
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                        <img src={b.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-foreground group-hover:text-primary transition-all line-clamp-1 block">
                        {b.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          by {b.profiles?.name}
                        </span>
                        {likesCount > 0 && (
                          <span className="text-[10px] text-red-500">
                            ♥ {likesCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* おすすめシリーズ */}
      {recommendedCollections && recommendedCollections.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <List className="h-4 w-4 text-primary" />
              おすすめのシリーズ
            </h2>
          </div>
          <div className="p-2">
            <div className="flex flex-col">
              {recommendedCollections.map((col: any) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.id}`}
                  className="flex flex-col p-3 rounded-md hover:bg-muted transition-colors group"
                >
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-all line-clamp-1">
                    {col.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    by {col.profiles?.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* トレンドタグ */}
      {trendingTags.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              今週のトレンドタグ
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">直近1週間の投稿数</p>
          </div>
          <div className="p-2">
            <div className="flex flex-wrap gap-2 p-2">
              {trendingTags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                  #{tag.name}
                  <span className="text-[10px] opacity-70">{tag.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 人気タグ */}
      {popularTags.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <Hash className="h-4 w-4 text-primary" />
              人気タグ
            </h2>
          </div>
          <div className="p-2">
            <div className="flex flex-col">
              {popularTags.map((tag: any) => (
                <Link
                  key={tag.name}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-all group"
                >
                  <span className="text-sm font-bold text-foreground/70 group-hover:text-primary transition-all">
                    #{tag.name}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
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
                  {allTags.slice(15, 40).map((tag: any) => (
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

      {/* アクティビティフィード */}
      {activities.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-bold flex items-center gap-2 text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              最近のアクティビティ
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">直近24時間</p>
          </div>
          <div className="p-2">
            <div className="flex flex-col">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/blog/${activity.blog_slug}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                    {activity.user_avatar ? (
                      <img src={activity.user_avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {activity.user_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-bold">{activity.user_name}</span>
                      {activity.type === "like" ? " がいいねしました" : " がコメントしました"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {activity.blog_title}
                    </p>
                    {activity.type === "comment" && activity.comment_preview && (
                      <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5 italic">
                        &quot;{activity.comment_preview}...&quot;
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {(() => {
                        const d = new Date(activity.created_at)
                        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
                      })()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
