"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Layers, Plus, Loader2, Lock } from "lucide-react"
import { getCollections, addBlogToCollection, removeBlogFromCollection, getBlogCollections } from "@/actions/collection"
import { CollectionType } from "@/types"
import { toast } from "sonner"
import CollectionDialog from "./CollectionDialog"
import { createClient } from "@/utils/supabase/client"

interface AddToCollectionDialogProps {
  blogId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddToCollectionDialog({ blogId, isOpen, onOpenChange }: AddToCollectionDialogProps) {
  const [collections, setCollections] = useState<CollectionType[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndData = async () => {
      if (!isOpen) return

      setIsLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      try {
        const [userCols, blogCols] = await Promise.all([
          getCollections(user.id),
          getBlogCollections(blogId)
        ])

        setCollections(userCols)
        setSelectedIds(blogCols.map(c => c.id))
      } catch (error) {
        console.error("Failed to fetch collections", error)
        toast.error("コレクションの取得に失敗しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndData()
  }, [isOpen, blogId])

  const handleToggle = async (collectionId: string, checked: boolean) => {
    setIsProcessing(collectionId)
    try {
      if (checked) {
        const res = await addBlogToCollection(collectionId, blogId)
        if (res.success) {
          setSelectedIds([...selectedIds, collectionId])
          toast.success("シリーズに追加しました")
        } else {
          toast.error(res.error)
        }
      } else {
        const res = await removeBlogFromCollection(collectionId, blogId)
        if (res.success) {
          setSelectedIds(selectedIds.filter(id => id !== collectionId))
          toast.success("シリーズから削除しました")
        } else {
          toast.error(res.error)
        }
      }
    } catch (error) {
      toast.error("エラーが発生しました")
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            シリーズに追加
          </DialogTitle>
          <DialogDescription>
            この記事を追加するシリーズを選択してください。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <p className="text-xs text-muted-foreground font-bold">読み込み中...</p>
            </div>
          ) : collections.length > 0 ? (
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-3">
                {collections.map((col) => (
                  <div key={col.id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`add-col-${col.id}`}
                      checked={selectedIds.includes(col.id)}
                      disabled={isProcessing === col.id}
                      onCheckedChange={(checked) => handleToggle(col.id, checked === true)}
                    />
                    <label
                      htmlFor={`add-col-${col.id}`}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-sm font-bold truncate">{col.title}</span>
                      {!col.is_public && <Lock className="h-3 w-3 text-amber-500 ml-2" />}
                      {isProcessing === col.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground italic mb-4">シリーズがありません。</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {userId && (
            <CollectionDialog
              userId={userId}
              onSuccess={(newCol) => setCollections([newCol, ...collections])}
            />
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
