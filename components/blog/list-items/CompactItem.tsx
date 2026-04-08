"use client"

import React from "react"
import Link from "next/link"
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

  // Extract a clean short date string (first part before any parenthesis or long suffix)
  const shortDate = data.dateDisplay.split("前")[0]
    ? data.dateDisplay.split("前")[0] + "前"
    : data.dateDisplay.split(" ")[0] ?? data.dateDisplay

  return (
    <div className="group bg-card hover:bg-muted/30 transition-colors duration-200 border-b border-border/40 last:border-0">
      <div className="px-4 py-3 sm:px-6 flex items-center gap-3 sm:gap-4">
        {/* Date – fixed width, hidden on mobile */}
        <div className="hidden sm:flex w-24 flex-shrink-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60 uppercase whitespace-nowrap">
          {shortDate}
          {!data.isPublished && (
            <Badge
              variant="outline"
              className="text-[9px] h-3.5 px-1 border-primary/40 text-primary font-bold"
            >
              D
            </Badge>
          )}
        </div>

        {/* Title + Tags */}
        <div className="flex-1 min-w-0">
          <Link href={`/blog/${data.id}`} className="flex items-center gap-3 group/link">
            <h2 className="text-sm sm:text-[15px] font-bold text-foreground group-hover/link:text-primary transition-colors truncate leading-none">
              {data.title}
            </h2>
            {data.tags.length > 0 && (
              <div className="hidden md:flex gap-2 overflow-hidden flex-shrink-0">
                {data.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium text-muted-foreground/40 whitespace-nowrap"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        </div>

        {/* Right: author, mobile date, action */}
        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold text-muted-foreground whitespace-nowrap">
            by{" "}
            <span className="text-foreground/80 group-hover:text-primary transition-colors">
              {data.author.name}
            </span>
          </span>
          {/* Mobile: show draft badge */}
          {!data.isPublished && (
            <Badge
              variant="outline"
              className="sm:hidden text-[9px] h-4 px-1.5 border-primary/40 text-primary font-bold"
            >
              DRAFT
            </Badge>
          )}
          <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
        </div>
      </div>
    </div>
  )
}

export default CompactItem