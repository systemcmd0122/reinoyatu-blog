import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import BlogListView from "@/components/blog/BlogListView"
import { getUserBookmarks } from "@/actions/bookmark"

// ユーザーのブックマーク一覧を表示するコンポーネント
const BookmarksList = async ({ userId }: { userId: string }) => {
  // ブックマークしたブログ一覧を取得
  const { blogs, error } = await getUserBookmarks(userId)

  // ブックマークデータがない場合のメッセージ
  if (!blogs.length || error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          ブックマークされたブログ記事がありません
        </h2>
        <p className="text-muted-foreground mb-6">
          気に入った記事があれば、ブックマークボタンを押して保存してください
        </p>
        <Link href="/">
          <Button>
            ブログ一覧に戻る
          </Button>
        </Link>
      </div>
    )
  }

  // ブックマーク一覧表示
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">ブックマーク</h1>
            <p className="text-muted-foreground mt-1">保存した記事の一覧です</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-full">
              ホームへ戻る
            </Button>
          </Link>
        </div>
        
        <BlogListView blogs={blogs} />
      </div>
    </div>
  )
}

// メインページコンポーネント
const BookmarksPage = async () => {
  const supabase = createClient()

  // ユーザーセッションを取得
  const { data: { session } } = await supabase.auth.getSession()

  // 認証されていない場合、ログインページにリダイレクト
  if (!session) {
    redirect("/login?next=/bookmarks")
  }

  // ユーザーIDを取得して、ブックマーク一覧表示コンポーネントをSuspenseで囲む
  return <BookmarksList userId={session.user.id} />
}

export default BookmarksPage