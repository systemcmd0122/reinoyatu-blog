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
  blog: any
  onRemove: (id: string) => void
}

export function SortableBlogItem({ id, blog, onRemove }: SortableBlogItemProps) {
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
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-4 p-4 rounded-2xl bg-card border border-border group relative",
        isDragging && "shadow-2xl border-primary"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 flex items-center cursor-grab active:cursor-grabbing px-1 hover:text-primary transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {blog.image_url && (
        <div className="flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden border border-border">
          <Image src={blog.image_url} alt={blog.title} width={96} height={54} className="object-cover w-full h-full" />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {blog.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatJST(blog.created_at)}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          asChild
        >
          <a href={`/blog/${blog.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(blog.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
