"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"
import { formatRelativeTime } from "@/utils/date"
import { BlogType } from "@/types"

interface CardItemProps {
  blog: BlogType
  priority?: boolean
}

const CardItem: React.FC<CardItemProps> = ({ blog, priority }) => {
  const router = useRouter()

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${blog.profiles.id}`)
  }

  const relativeTime = formatRelativeTime(blog.updated_at)

  return (
    <div className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 h-full">
      {/* Thumbnail */}
      <Link href={`/blog/${blog.id}`} className="relative aspect-video overflow-hidden bg-muted">
        {blog.image_url ? (
          <Image
            src={blog.image_url}
            alt={blog.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 font-bold text-2xl select-none">
            NO IMAGE
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {blog.tags?.slice(0, 2).map((tag) => (
            <span key={tag.name} className="text-[10px] font-bold text-primary uppercase tracking-wider">
              #{tag.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <Link href={`/blog/${blog.id}`} className="block mb-2 flex-1">
          <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {blog.title}
          </h2>
        </Link>

        {/* Summary */}
        {blog.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {blog.summary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleAuthorClick}>
            <div className="relative h-6 w-6 rounded-full overflow-hidden border border-border">
              <Image
                src={blog.profiles?.avatar_url || "/default.png"}
                alt={blog.profiles?.name || "User"}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[80px]">
              {blog.profiles?.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Heart className="h-3.5 w-3.5" />
              <span>{blog.likes_count || 0}</span>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {relativeTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardItem
