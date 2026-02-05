import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getDrafts } from "@/actions/blog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

const DraftsPage = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/settings/drafts")
  }

  const { drafts, error } = await getDrafts(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">下書き一覧</h2>
          <p className="text-muted-foreground">
            未公開の執筆中の記事を管理・編集できます。
          </p>
        </div>
      </div>

      {!drafts || drafts.length === 0 ? (
        <Card className="border-dashed flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>下書きはありません</CardTitle>
          <CardDescription className="mt-2">
            新しい記事を書き始めて、下書きとして保存してみましょう。
          </CardDescription>
          <Link href="/blog/new" className="mt-6">
            <Button>新しい記事を作成</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{draft.title || "無題の記事"}</CardTitle>
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5 bg-muted px-2 py-1 rounded">
                    <Calendar className="h-3 w-3" />
                    更新: {format(new Date(draft.updated_at), "yyyy/MM/dd HH:mm")}
                  </div>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {draft.summary || draft.content.substring(0, 100).replace(/[#_*`]/g, "")}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 flex justify-end gap-2">
                <Link href={`/blog/${draft.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    編集を再開
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DraftsPage
