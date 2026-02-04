"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"
import { formatRelativeTime } from "@/utils/date"
import { BlogType } from "@/types"

interface ListItemProps {
  blog: BlogType
  priority?: boolean
}

const ListItem: React.FC<ListItemProps> = ({ blog }) => {
  const router = useRouter()

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${blog.profiles.id}`)
  }

  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/tags/${encodeURIComponent(tagName)}`)
  }

  const relativeTime = formatRelativeTime(blog.updated_at)

  return (
    <div className="group block bg-card hover:bg-muted/30 transition-colors duration-200">
      <div className="p-4 sm:p-6 flex gap-4 items-start">
        {/* Author Avatar */}
        <div 
          className="flex-shrink-0 cursor-pointer" 
          onClick={handleAuthorClick}
        >
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border border-border">
            <Image
              src={blog.profiles?.avatar_url || "/default.png"}
              alt={blog.profiles?.name || "Unknown User"}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
          {/* Author info and date */}
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-2 overflow-hidden">
            <span 
              className="font-medium text-foreground/80 hover:text-primary transition-colors cursor-pointer truncate max-w-[120px]"
              onClick={handleAuthorClick}
            >
              @{blog.profiles?.name || "unknown"}
            </span>
            <span>が{relativeTime}に更新</span>
          </div>

          {/* Title */}
          <Link href={`/blog/${blog.id}`} className="block">
            <h2 className={cn(
              "text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight",
              "line-clamp-2"
            )}>
              {blog.title}
            </h2>
          </Link>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
              {blog.tags.map((tag) => (
                <span
                  key={tag.name}
                  onClick={(e) => handleTagClick(e, tag.name)}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-muted/50 px-2 py-0.5 rounded"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer - Likes */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
              <Heart className="h-4 w-4 fill-none" />
              <span>{blog.likes_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Optional Thumbnail */}
        {blog.image_url && (
          <div className="hidden sm:block flex-shrink-0 relative h-20 w-32 rounded-lg overflow-hidden border border-border shadow-sm">
            <Image
              src={blog.image_url}
              alt={blog.title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ListItem
