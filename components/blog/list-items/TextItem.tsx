"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, User, ArrowRight } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"
import BlogActionMenu from "../BlogActionMenu"

interface TextItemProps {
  blog: BlogType
  currentUserId?: string | null
}

const TextItem: React.FC<TextItemProps> = ({ blog, currentUserId }) => {
  const router = useRouter()
  const data = getBlogDisplayData(blog)

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (data.author.id) {
      router.push(`/profile/${data.author.id}`)
    }
  }

  return (
    <div className="group bg-card hover:bg-muted/30 transition-all duration-300 border-l-[3px] border-transparent hover:border-primary border-b border-border/40 last:border-b-0">
      <div className="px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: meta + title + tags */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Author + date row */}
            <div className="flex items-center gap-2 flex-wrap">
              {!data.isPublished && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 font-bold border-primary/60 text-primary px-1.5 py-0 flex-shrink-0"
                >
                  DRAFT
                </Badge>
              )}
              <button
                type="button"
                className="flex items-center gap-1.5 cursor-pointer group/author"
                onClick={handleAuthorClick}
              >
                <div className="bg-muted rounded-full p-1 group-hover/author:bg-primary/15 transition-colors">
                  <User className="h-3 w-3 text-muted-foreground group-hover/author:text-primary transition-colors" />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover/author:text-primary transition-colors truncate max-w-[120px] leading-none">
                  {data.author.name}
                </span>
              </button>
              <span className="text-[10px] text-muted-foreground/30 leading-none">•</span>
              <span className="text-[11px] text-muted-foreground/60 font-semibold uppercase tracking-wide leading-none whitespace-nowrap">
                {data.dateDisplay}
              </span>
            </div>

            {/* Title */}
            <Link href={`/blog/${data.id}`} className="block group/title">
              <h2 className="text-base sm:text-lg font-black text-foreground group-hover/title:text-primary transition-colors line-clamp-1 leading-snug tracking-tight">
                {data.title}
              </h2>
            </Link>

            {/* Tags */}
            {data.tags.length > 0 && (
              <div className="flex items-center gap-2.5 pt-0.5 overflow-hidden">
                {data.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest whitespace-nowrap"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: likes + action + arrow */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              <span className="text-sm font-bold tabular-nums">{data.likesCount}</span>
            </div>
            <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
            <Link
              href={`/blog/${data.id}`}
              className="hidden sm:flex opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300"
              aria-label="Read article"
            >
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextItem