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

interface CollectionSortableListProps {
  collectionId: string
  initialItems: any[]
}

export default function CollectionSortableList({ collectionId, initialItems }: CollectionSortableListProps) {
  const [items, setItems] = useState(initialItems)
  const [isPending, setIsPending] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }

  async function handleSaveOrder() {
    setIsPending(true)
    try {
      const res = await updateCollectionItemsOrder(collectionId, items.map(item => item.id))
      if (res.success) {
        toast.success("並び順を保存しました")
        setHasChanges(false)
      } else {
        toast.error(res.error)
      }
    } catch (error) {
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
        setItems(items.filter(item => item.blog_id !== blogId))
        toast.success("コレクションから削除しました")
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error("エラーが発生しました")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">記事の並べ替え</h3>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveOrder} disabled={isPending} className="rounded-xl font-bold h-10 animate-in fade-in slide-in-from-right-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            変更を保存
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.map((item) => (
              <SortableBlogItem
                key={item.id}
                id={item.id}
                blog={item.blogs}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
          <p className="text-muted-foreground">記事がありません</p>
        </div>
      )}
    </div>
  )
}
