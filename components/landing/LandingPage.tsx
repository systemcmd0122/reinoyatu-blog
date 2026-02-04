import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PenLine, Globe, BookOpen, ArrowRight } from "lucide-react"
import BlogItem from "@/components/blog/BlogItem"

const LandingPage = async () => {
  const supabase = createClient()

  // 最新のブログ記事を3件取得
  const { data: blogsData } = await supabase
    .from("blogs")
    .select(
      `
      *,
      profiles (
        id,
        name,
        avatar_url
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-background to-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
            あなたの知識と情熱を、世界へ
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            「例のヤツ」は、あなたのアイデア、ストーリー、専門知識を共有し、同じ興味を持つ人々と繋がるためのブログプラットフォームです。
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                今すぐ始める <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                ログイン
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">主な機能</h2>
            <p className="mt-4 text-lg text-muted-foreground">ブログ作成をサポートするパワフルな機能</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <PenLine className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">簡単で美しい投稿</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Markdown記法に対応した直感的なエディタで、ストレスなく美しい記事を作成できます。
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">多様なコンテンツ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  技術ブログから日常の出来事まで、あらゆるジャンルのコンテンツを自由に表現し、共有できます。
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">コミュニティとの繋がり</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  いいねやコメント機能を通じて、読者と交流し、フィードバックを得ることができます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      {blogsData && blogsData.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">最新の投稿</h2>
              <p className="mt-4 text-lg text-muted-foreground">コミュニティからの新しい声を発見しよう</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogsData.map((blog) => (
                <BlogItem key={blog.id} blog={blog} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">さあ、あなたの物語を始めよう</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            今すぐ無料でアカウントを作成し、あなたのユニークな視点を世界と共有しましょう。
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                アカウント登録へ <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
