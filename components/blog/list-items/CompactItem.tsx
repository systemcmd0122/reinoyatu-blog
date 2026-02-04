"use client"

import React from "react"
import Link from "next/link"
import { formatRelativeTime } from "@/utils/date"
import { BlogType } from "@/types"

interface CompactItemProps {
  blog: BlogType
}

const CompactItem: React.FC<CompactItemProps> = ({ blog }) => {
  const relativeTime = formatRelativeTime(blog.updated_at)

  return (
    <div className="group block bg-card hover:bg-muted/30 transition-colors duration-200">
      <div className="px-4 py-3 sm:px-6 flex items-center gap-4">
        {/* Date/Time - Fixed width */}
        <div className="hidden sm:block w-24 flex-shrink-0 text-xs text-muted-foreground">
          {relativeTime}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <Link href={`/blog/${blog.id}`} className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {blog.title}
            </h2>
            {blog.tags && blog.tags.length > 0 && (
              <div className="hidden md:flex gap-1 overflow-hidden">
                {blog.tags.slice(0, 1).map((tag) => (
                  <span key={tag.name} className="text-[10px] text-muted-foreground/60">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </Link>
        </div>

        {/* Author */}
        <div className="flex-shrink-0 flex items-center gap-2">
           <span className="text-xs text-muted-foreground hidden sm:inline-block">
            by <span className="text-foreground/70">{blog.profiles?.name}</span>
          </span>
          <div className="sm:hidden text-[10px] text-muted-foreground">
            {relativeTime}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompactItem
