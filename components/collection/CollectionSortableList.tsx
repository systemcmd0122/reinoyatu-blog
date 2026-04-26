"use client"

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableBlogItem } from './SortableBlogItem'
import { updateCollectionItemsOrder, removeBlogFromCollection } from '@/actions/collection'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Save, Loader2, ListOrdered } from 'lucide-react'

interface CollectionItem {
  id: string
  blog_id: string
  order_index: number
  blogs: any
}

interface CollectionSortableListProps {
  collectionId: string
  initialItems: CollectionItem[]
}

export default function CollectionSortableList({ collectionId, initialItems }: CollectionSortableListProps) {
  const [items, setItems] = useState<CollectionItem[]>(
    [...initialItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  )
  const [isPending, setIsPending] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id)
        const newIndex = prev.findIndex((item) => item.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }

  async function handleSaveOrder() {
    setIsPending(true)
    try {
      // collection_items の id（行ID）の配列を順番に渡す
      const orderedIds = items.map((item) => item.id)
      const res = await updateCollectionItemsOrder(collectionId, orderedIds)
      if (res.success) {
        toast.success("並び順を保存しました")
        setHasChanges(false)
      } else {
        toast.error(res.error ?? "並び順の保存に失敗しました")
      }
    } catch (error) {
      console.error("Order update error:", error)
      toast.error("エラーが発生しました")
    } finally {
      setIsPending(false)
    }
  }

  async function handleRemove(blogId: string) {
    if (!confirm("このシリーズから削除しますか？（記事自体は削除されません）")) return
    try {
      const res = await removeBlogFromCollection(collectionId, blogId)
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.blog_id !== blogId))
        toast.success("コレクションから削除しました")
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("エラーが発生しました")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-muted-foreground">
            {items.length} 件 — ドラッグで並べ替え
          </span>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSaveOrder}
            disabled={isPending}
            size="sm"
            className="rounded-xl font-bold h-9 animate-in fade-in slide-in-from-right-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
        )}
      </div>

      {/* Sortable list */}
      {items.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableBlogItem
                  key={item.id}
                  id={item.id}
                  index={index}
                  blog={item.blogs}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
          <p className="text-sm text-muted-foreground">記事がありません</p>
        </div>
      )}
    </div>
  )
}