import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import BlogItem from "@/components/blog/BlogItem"
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ブックマークした記事</h1>
        <Link href="/">
          <Button variant="outline">
            ブログ一覧に戻る
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {blogs.map((blog) => (
          <BlogItem key={blog.id} blog={blog} />
        ))}
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
    redirect("/login?callbackUrl=/bookmarks")
  }

  // ユーザーIDを取得して、ブックマーク一覧表示コンポーネントをSuspenseで囲む
  return <BookmarksList userId={session.user.id} />
}

export default BookmarksPage