import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getUserBlogs } from "@/actions/data"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"
import Link from "next/link"
import DraftList from "@/components/settings/DraftList"
import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "記事管理",
  description: "作成した記事の管理・編集ができます。",
}

const DraftsPage = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/settings/drafts")
  }

  const { blogs, error } = await getUserBlogs()

  if (error) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">記事管理</h2>
          <p className="text-muted-foreground text-sm">エラーが発生しました</p>
        </div>
        <Card className="border-destructive/20 bg-destructive/5 p-10 text-center rounded-3xl">
          <CardTitle className="text-xl font-black text-destructive">データの取得に失敗しました</CardTitle>
          <CardDescription className="mt-2">
            {typeof error === "string" ? error : (error as any).message || "不明なエラーが発生しました"}
          </CardDescription>
        </Card>
      </div>
    )
  }

  const drafts = blogs?.filter(b => !b.is_published) || []
  const published = blogs?.filter(b => b.is_published) || []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2">記事管理</h2>
          <p className="text-muted-foreground text-sm">
            公開済みの記事と下書きを一括で管理・編集できます。
          </p>
        </div>
        <Button asChild className="font-bold rounded-xl shadow-lg shadow-primary/20">
          <Link href="/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="drafts" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="drafts" className="font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            下書き ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="published" className="font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            公開済み ({published.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="mt-0 outline-none">
          {drafts.length === 0 ? (
            <Card className="border-dashed bg-muted/5 flex flex-col items-center justify-center py-20 text-center rounded-3xl">
              <div className="bg-muted p-5 rounded-2xl mb-4">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <CardTitle className="text-xl font-black">下書きはありません</CardTitle>
              <CardDescription className="mt-2 max-w-[280px]">
                新しいアイデアを形にしましょう。
              </CardDescription>
              <Link href="/blog/new" className="mt-6">
                <Button variant="outline" className="font-bold rounded-xl border-2">記事を書く</Button>
              </Link>
            </Card>
          ) : (
            <DraftList drafts={drafts} userId={user.id} />
          )}
        </TabsContent>

        <TabsContent value="published" className="mt-0 outline-none">
          {published.length === 0 ? (
            <Card className="border-dashed bg-muted/5 flex flex-col items-center justify-center py-20 text-center rounded-3xl">
              <div className="bg-muted p-5 rounded-2xl mb-4">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <CardTitle className="text-xl font-black">公開記事はありません</CardTitle>
              <CardDescription className="mt-2 max-w-[280px]">
                下書きを完成させて、世界に発信しましょう。
              </CardDescription>
            </Card>
          ) : (
            <DraftList drafts={published} userId={user.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DraftsPage
