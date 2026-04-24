"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"
import BlogActionMenu from "../BlogActionMenu"

interface ListItemProps {
  blog: BlogType
  priority?: boolean
  currentUserId?: string | null
}

const ListItem: React.FC<ListItemProps> = ({ blog, priority, currentUserId }) => {
  const router = useRouter()
  const data = getBlogDisplayData(blog)

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (data.author.id) {
      router.push(`/profile/${data.author.id}`)
    }
  }

  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/tags/${encodeURIComponent(tagName)}`)
  }

  return (
    <div className="group bg-card hover:bg-muted/30 transition-all duration-200 border-b last:border-0">
      <div className="p-4 flex gap-4 items-start">
        {/* Author Avatar */}
        <button
          type="button"
          className="flex-shrink-0 pt-0.5 cursor-pointer"
          onClick={handleAuthorClick}
          aria-label={`View ${data.author.name}'s profile`}
        >
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden border border-border group-hover:border-primary/60 transition-all">
            <Image
              src={data.author.avatarUrl}
              alt={data.author.name}
              fill
              priority={priority}
              className="object-cover"
            />
          </div>
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Author row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <button
                type="button"
                className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate max-w-[160px] leading-none"
                onClick={handleAuthorClick}
              >
                @{data.author.name}
              </button>
              <span className="text-[10px] text-muted-foreground/40 leading-none">•</span>
              <span className="text-xs text-muted-foreground/70 font-medium leading-none whitespace-nowrap">
                {data.dateDisplay}
              </span>
              {!data.isPublished && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 font-bold border-primary/60 text-primary px-1.5 py-0 flex-shrink-0"
                >
                  DRAFT
                </Badge>
              )}
            </div>
            <div className="flex-shrink-0">
              <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
            </div>
          </div>

          {/* Title */}
          <Link href={`/blog/${data.id}`} className="block">
            <h2 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight line-clamp-2">
              {data.title}
            </h2>
          </Link>

          {/* Tags */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {data.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => handleTagClick(e, tag)}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all cursor-pointer bg-muted/60 px-2 py-0.5 rounded-md leading-none"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Likes */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-muted-foreground group/like">
              <Heart className="h-4 w-4 transition-colors group-hover/like:text-rose-500 group-hover/like:fill-rose-500" />
              <span className="text-sm font-bold">{data.likesCount}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail (md+) */}
        {data.imageUrl && (
          <Link
            href={`/blog/${data.id}`}
            className="hidden md:block flex-shrink-0 relative h-24 w-36 rounded-lg overflow-hidden border group-hover:opacity-90 transition-all"
          >
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              className="object-cover"
            />
          </Link>
        )}
      </div>
    </div>
  )
}

export default ListItem