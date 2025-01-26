import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  PenLine, 
  Globe, 
  BookOpen} from "lucide-react"

import BlogItem from "@/components/blog/BlogItem"
import Loading from "@/app/loading"

const MainPage = async () => {
  const supabase = createClient()

  // ユーザーセッションを取得
  const { data: { session } } = await supabase.auth.getSession()

  // 認証されていない場合、未認証のホームページを表示
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            ようこそ 例のヤツ｜ブログ へ
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            あなたの思いや知識を共有し、世界とつながる場所
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <PenLine className="h-8 w-8 text-primary" />
                <CardTitle>簡単投稿</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Markdownに対応し、美しく読みやすい記事を簡単に作成できます。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <CardTitle>多様なコンテンツ</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                技術、趣味、生活、あらゆるトピックについて自由に投稿できます。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Globe className="h-8 w-8 text-primary" />
                <CardTitle>グローバルな共有</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                世界中の人々と体験や知識を共有し、つながりを広げましょう。
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-6">
          <div className="inline-flex flex-col md:flex-row gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full md:w-auto">
                ログイン
              </Button>
            </Link>
            <Link href="/signup">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full md:w-auto"
              >
                新規登録
              </Button>
            </Link>
          </div>

          <div className="mt-8 max-w-2xl mx-auto">
            <p className="text-muted-foreground">
              まずは無料で登録して、あなたの物語を世界に発信しましょう。
              新しいアイデア、体験、洞察を共有し、コミュニティの一員になりましょう。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ログイン済みの場合、ブログ一覧を取得
  const { data: blogsData, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles (
        name,
        avatar_url
      )
    `
    )
    .order("updated_at", { ascending: false })

  // ブログデータがない場合のメッセージ
  if (!blogsData || error) {
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
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-end mb-6">
          <Link href="/blog/new">
            <Button>
              新規ブログ投稿
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {blogsData.map((blog) => (
            <BlogItem key={blog.id} blog={blog} />
          ))}
        </div>
      </div>
    </Suspense>
  )
}

export default MainPage