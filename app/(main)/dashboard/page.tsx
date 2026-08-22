import { createClient } from "@/utils/supabase/server"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Eye, Heart, Users, FileText, ArrowLeft, TrendingUp } from "lucide-react"
import { BreadcrumbListJsonLd } from "@/components/seo/JsonLd"

export const metadata: Metadata = {
  title: "著者ダッシュボード",
  description: "あなたのブログのパフォーマンスを確認できます。",
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 著者の記事を取得
  const { data: blogs } = await supabase
    .from("blogs")
    .select(`
      id,
      slug,
      title,
      view_count,
      created_at,
      updated_at,
      is_published,
      likes(count)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // フォロワー数を取得
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id)

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single()

  const blogList = blogs || []
  const publishedBlogs = blogList.filter(b => b.is_published)
  const draftBlogs = blogList.filter(b => !b.is_published)

  // 統計を計算
  const totalViews = publishedBlogs.reduce((sum, b) => sum + (b.view_count || 0), 0)
  const totalLikes = publishedBlogs.reduce((sum, b) => {
    const likes = b.likes as any
    return sum + (likes?.[0]?.count || 0)
  }, 0)
  const totalBlogs = publishedBlogs.length

  // 直近7日のいいね推移（簡易版）
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentBlogs = publishedBlogs.filter(b => new Date(b.created_at) >= oneWeekAgo)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "ホーム", url: baseUrl },
          { name: "著者ダッシュボード", url: `${baseUrl}/dashboard` },
        ]}
      />
      <div className="min-h-screen bg-muted/30 dark:bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors group">
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              トップに戻る
            </Link>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              著者ダッシュボード
            </h1>
            <p className="text-muted-foreground mt-2">
              {profile?.name || "あなた"}さんのブログパフォーマンス
            </p>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">投稿数</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalBlogs}</p>
              <p className="text-xs text-muted-foreground mt-1">公開中: {publishedBlogs.length} / 下書き: {draftBlogs.length}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">総閲覧数</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                平均: {totalBlogs > 0 ? Math.round(totalViews / totalBlogs).toLocaleString() : 0} / 記事
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">総いいね数</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalLikes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                平均: {totalBlogs > 0 ? (totalLikes / totalBlogs).toFixed(1) : 0} / 記事
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">フォロワー</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{(followersCount || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">あなたのファン</p>
            </div>
          </div>

          {/* 直近7日の活動 */}
          {recentBlogs.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-8">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                直近7日の新規投稿
              </h2>
              <div className="space-y-3">
                {recentBlogs.map((blog) => {
                  const likes = blog.likes as any
                  const likesCount = likes?.[0]?.count || 0
                  return (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.slug || blog.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{blog.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(blog.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground ml-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {blog.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart className="h-4 w-4" />
                          {likesCount}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* 記事一覧 */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">全記事一覧</h2>
            </div>
            <div className="divide-y divide-border">
              {blogList.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">まだ記事がありません</p>
                  <Link href="/blog/new">
                    <Button>最初の記事を書く</Button>
                  </Link>
                </div>
              ) : (
                blogList.map((blog) => {
                  const likes = blog.likes as any
                  const likesCount = likes?.[0]?.count || 0
                  return (
                    <Link
                      key={blog.id}
                      href={`/blog/${blog.slug || blog.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{blog.title}</p>
                          {!blog.is_published && (
                            <span className="text-[10px] px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                              下書き
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(blog.created_at).toLocaleDateString("ja-JP")}
                          {blog.updated_at !== blog.created_at && (
                            <> · 更新: {new Date(blog.updated_at).toLocaleDateString("ja-JP")}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground ml-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {blog.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart className="h-4 w-4" />
                          {likesCount}
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
