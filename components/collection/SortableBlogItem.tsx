"use client"

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatJST } from '@/utils/date'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SortableBlogItemProps {
  id: string
  index: number
  blog: any
  onRemove: (blogId: string) => void
}

export function SortableBlogItem({ id, index, blog, onRemove }: SortableBlogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
    position: isDragging ? 'relative' as const : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 group",
        isDragging && "shadow-2xl border-primary/50 bg-card/90"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded-lg cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors"
        aria-label="ドラッグして並べ替え"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Index number */}
      <span className="flex-shrink-0 w-6 text-center text-xs font-black text-muted-foreground/50">
        {index + 1}
      </span>

      {/* Thumbnail */}
      {blog.image_url && (
        <div className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-border/40">
          <Image
            src={blog.image_url}
            alt={blog.title}
            width={64}
            height={40}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Title & date — full title visible, wraps if needed */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug break-words group-hover:text-primary transition-colors">
          {blog.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5 flex-shrink-0" />
          <span>{formatJST(blog.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/50 hover:text-primary hover:bg-primary/5"
          asChild
        >
          <a href={`/blog/${blog.id}`} target="_blank" rel="noopener noreferrer" title="記事を開く">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5"
          onClick={() => onRemove(blog.id)}
          title="削除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}