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
import { CollectionWithItemsType } from "@/types"

interface CollectionManageDialogProps {
  collection: CollectionWithItemsType
}

export default function CollectionManageDialog({ collection }: CollectionManageDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
          <ListOrdered className="h-4 w-4" />
          アイテムを管理
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-black tracking-tight">シリーズ管理</DialogTitle>
          <DialogDescription>
            ドラッグ＆ドロップで記事の順序を入れ替えたり、シリーズから削除したりできます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar py-4">
          <CollectionSortableList 
            collectionId={collection.id} 
            initialItems={collection.collection_items} 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
