import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import CardItem from "@/components/blog/list-items/CardItem"
import { BlogType } from "@/types"
import { ArrowRight, Layers } from "lucide-react"
import { LandingHero } from "./LandingHero"
import { LandingFeatures } from "./LandingFeatures"

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

  const blogs = (blogsData || []) as unknown as BlogType[]

  return (
    <div className="w-full bg-background overflow-hidden">
      <LandingHero />

      <LandingFeatures />

      {/* Recent Posts Section */}
      {blogs && blogs.length > 0 && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">最新の投稿</h2>
              <p className="text-muted-foreground text-lg">コミュニティで今、話題になっているストーリー。</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <CardItem key={blog.id} blog={blog} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-2xl font-bold px-8">
                  すべての記事を見る
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-foreground">
              さあ、新時代のブログ体験へ
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              登録はわずか1分。あなたの物語を今すぐ世界へ。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-xl font-bold gap-2 bg-primary text-primary-foreground">
                  無料でアカウント登録
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-xl font-bold bg-background">
                  ログインする
                </Button>
              </Link>
            </div>
            <div className="pt-8">
              <Link href="/changelog" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1">
                <Layers className="h-4 w-4" />
                最新のアップデートを確認する
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
