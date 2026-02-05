"use client"

import React, { useState, useTransition } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, ArrowRight, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { deleteBlog } from "@/actions/blog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DraftListProps {
  drafts: any[]
  userId: string
}

const DraftList: React.FC<DraftListProps> = ({ drafts, userId }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (id: string, imageUrl: string | null) => {
    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteBlog({
        blogId: id,
        imageUrl,
        userId
      })

      if (res.success) {
        toast.success("下書きを削除しました")
        router.refresh()
      } else {
        toast.error(res.error || "削除に失敗しました")
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="grid gap-4">
      {drafts.map((draft) => (
        <Card key={draft.id} className="hover:border-primary/50 transition-colors group">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {draft.title || "無題の記事"}
              </CardTitle>
              <div className="flex items-center text-xs text-muted-foreground gap-1.5 bg-muted px-2 py-1 rounded">
                <Calendar className="h-3 w-3" />
                更新: {format(new Date(draft.updated_at), "yyyy/MM/dd HH:mm")}
              </div>
            </div>
            <CardDescription className="line-clamp-2 mt-2">
              {draft.summary || draft.content.substring(0, 100).replace(/[#_*`]/g, "") || "内容なし"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2 flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>下書きを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDelete(draft.id, draft.image_url)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isPending && deletingId === draft.id}
                  >
                    {(isPending && deletingId === draft.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "削除する"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Link href={`/blog/${draft.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2 border-2 font-bold">
                編集を再開
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default DraftList
