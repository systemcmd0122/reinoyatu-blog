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

const ListItem: React.FC<ListItemProps> = ({ blog, currentUserId }) => {
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
    <article className="group block bg-card hover:bg-muted/30 transition-all duration-200 border-b border-border/50 last:border-0">
      <div className="p-4 sm:p-7 flex gap-5 items-start">

        {/* Author avatar */}
        <button
          type="button"
          className="flex-shrink-0 pt-1 cursor-pointer"
          onClick={handleAuthorClick}
          aria-label={`${data.author.name}のプロフィールを見る`}
        >
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-all shadow-sm">
            <Image
              src={data.author.avatarUrl}
              alt={data.author.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Author info & action menu */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-2 overflow-hidden flex-wrap">
              <button
                type="button"
                className="font-black text-foreground hover:text-primary transition-colors cursor-pointer truncate max-w-[150px]"
                onClick={handleAuthorClick}
              >
                @{data.author.name}
              </button>
              <span className="text-[10px] text-muted-foreground/40" aria-hidden="true">•</span>
              <time className="font-medium text-muted-foreground/80">
                {data.dateDisplay}
              </time>
              {!data.isPublished && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 font-black border-primary text-primary px-1.5 py-0"
                >
                  DRAFT
                </Badge>
              )}
            </div>
            <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
          </div>

          {/* Title */}
          <Link href={`/blog/${data.id}`} className="block">
            <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight line-clamp-2">
              {data.title}
            </h2>
          </Link>

          {/* Tags */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1" aria-label="タグ">
              {data.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => handleTagClick(e, tag)}
                  className="text-[11px] sm:text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all cursor-pointer bg-muted/50 px-2 py-0.5 rounded"
                  aria-label={`#${tag}タグを検索`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Likes */}
          <div className="flex items-center gap-5 pt-3">
            <div className="flex items-center gap-1.5 text-muted-foreground group/like">
              <Heart className="h-4 w-4 transition-colors group-hover/like:text-rose-500 group-hover/like:fill-rose-500" aria-hidden="true" />
              <span className="text-sm font-bold" aria-label={`${data.likesCount}いいね`}>{data.likesCount}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {data.imageUrl && (
          <div className="hidden md:block flex-shrink-0 relative h-24 w-40 rounded-xl overflow-hidden border border-border/50 shadow-sm group-hover:shadow-md transition-all">
            <Image
              src={data.imageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="160px"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </article>
  )
}

export default ListItem