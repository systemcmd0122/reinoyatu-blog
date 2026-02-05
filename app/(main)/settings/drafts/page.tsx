import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getDrafts } from "@/actions/blog"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"
import DraftList from "@/components/settings/DraftList"

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
        <DraftList drafts={drafts} userId={user.id} />
      )}
    </div>
  )
}

export default DraftsPage
