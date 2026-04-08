"use client"

import React from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"
import BlogActionMenu from "../BlogActionMenu"

interface CompactItemProps {
  blog: BlogType
  currentUserId?: string | null
}

const CompactItem: React.FC<CompactItemProps> = ({ blog, currentUserId }) => {
  const data = getBlogDisplayData(blog)

  /** Display only the date part — strip relative suffix if present */
  const dateShort = data.dateDisplay.split(" (")[0].split("に")[0]

  return (
    <article className="group block bg-card hover:bg-muted/30 transition-colors duration-200 border-b border-border/50 last:border-0">
      <div className="px-4 py-3 sm:px-6 flex items-center gap-4">

        {/* Date / Draft badge — fixed width on sm+ */}
        <div className="hidden sm:flex w-28 flex-shrink-0 items-center gap-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wide">
          <time dateTime={dateShort}>{dateShort}</time>
          {!data.isPublished && (
            <Badge
              variant="outline"
              className="text-[9px] h-3 px-1 border-primary/30 text-primary font-black leading-none"
            >
              D
            </Badge>
          )}
        </div>

        {/* Title + inline tags */}
        <div className="flex-1 min-w-0">
          <Link href={`/blog/${data.id}`} className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {data.title}
            </h2>
            <div className="hidden md:flex gap-1.5 shrink-0">
              {data.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] font-medium text-muted-foreground/40 whitespace-nowrap">
                  #{tag}
                </span>
              ))}
            </div>
          </Link>
        </div>

        {/* Likes */}
        <div className="flex items-center gap-1.5 text-muted-foreground/50 shrink-0">
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs font-bold" aria-label={`${data.likesCount}いいね`}>{data.likesCount}</span>
        </div>

        {/* Author + mobile date + action menu */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block whitespace-nowrap">
            by{" "}
            <span className="text-foreground/80 group-hover:text-primary transition-colors">
              {data.author.name}
            </span>
          </span>
          <time className="sm:hidden text-[10px] font-bold text-muted-foreground/60">
            {data.dateDisplay}
          </time>
          <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
        </div>
      </div>
    </article>
  )
}

export default CompactItem