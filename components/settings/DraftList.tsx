"use client"

import React, { useState, useTransition, useMemo } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, ArrowRight, Trash2, Loader2, Search, ArrowUpDown, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { deleteBlog } from "@/actions/blog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DraftListProps {
  drafts: any[]
  userId: string
}

const DraftList: React.FC<DraftListProps> = ({ drafts, userId }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated_at_desc")

  const filteredAndSortedDrafts = useMemo(() => {
    return drafts
      .filter((draft) => {
        const title = draft.title?.toLowerCase() || ""
        const summary = draft.summary?.toLowerCase() || ""
        const content = draft.content?.toLowerCase() || ""
        const query = searchQuery.toLowerCase()
        return title.includes(query) || summary.includes(query) || content.includes(query)
      })
      .sort((a, b) => {
        if (sortBy === "updated_at_desc") {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        }
        if (sortBy === "updated_at_asc") {
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        }
        if (sortBy === "title_asc") {
          return (a.title || "").localeCompare(b.title || "")
        }
        return 0
      })
  }, [drafts, searchQuery, sortBy])

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="下書きを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-muted/50 border-none font-bold">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="並び替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at_desc">更新日が新しい順</SelectItem>
              <SelectItem value="updated_at_asc">更新日が古い順</SelectItem>
              <SelectItem value="title_asc">タイトル順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedDrafts.length > 0 ? (
          filteredAndSortedDrafts.map((draft) => (
            <Card key={draft.id} className="hover:border-primary/50 transition-all group shadow-sm hover:shadow-md rounded-2xl overflow-hidden border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-none font-black uppercase text-[10px] tracking-widest px-2 py-0.5">
                        Draft
                      </Badge>
                      <div className="flex items-center text-[10px] text-muted-foreground font-bold">
                        <Clock className="h-3 w-3 mr-1" />
                        最終更新: {format(new Date(draft.updated_at), "yyyy/MM/dd HH:mm")}
                      </div>
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                      {draft.title || "無題の記事"}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-2 mt-2 text-sm leading-relaxed">
                  {draft.summary || draft.content.substring(0, 150).replace(/[#_*`]/g, "") || "内容がありません"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 pb-5 px-6 flex justify-between items-center bg-muted/5 border-t border-border/30">
                <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {draft.content.length} 文字
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>下書きを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          この記事のデータは完全に削除され、元に戻すことはできません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-bold">キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(draft.id, draft.image_url)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                          disabled={isPending && deletingId === draft.id}
                        >
                          {(isPending && deletingId === draft.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "削除する"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Link href={`/blog/${draft.id}/edit`}>
                    <Button variant="default" size="sm" className="h-9 px-6 gap-2 font-black rounded-lg shadow-sm">
                      編集を再開
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-bold">一致する下書きが見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DraftList
