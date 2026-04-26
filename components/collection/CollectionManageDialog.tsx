"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ListOrdered } from "lucide-react"
import CollectionSortableList from "./CollectionSortableList"
import CollectionAddBlogDialog from "./CollectionAddBlogDialog"
import { CollectionWithItemsType } from "@/types"

interface CollectionManageDialogProps {
  collection: CollectionWithItemsType
}

export default function CollectionManageDialog({ collection }: CollectionManageDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2 flex-1">
          <ListOrdered className="h-4 w-4" />
          アイテムを管理
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] flex flex-col rounded-[2rem] gap-0 p-0 overflow-hidden">
        {/* Fixed header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">シリーズ管理</DialogTitle>
            <DialogDescription className="text-xs">
              ドラッグで順序変更、ゴミ箱アイコンで削除できます。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <CollectionAddBlogDialog
              collectionId={collection.id}
              userId={collection.user_id}
              onSuccess={() => {
                // Refresh is handled by server action router.refresh()
              }}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CollectionSortableList
            collectionId={collection.id}
            initialItems={collection.collection_items}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}