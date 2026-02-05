"use client"

import React from "react"
import Link from "next/link"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"

interface CompactItemProps {
  blog: BlogType
}

const CompactItem: React.FC<CompactItemProps> = ({ blog }) => {
  const data = getBlogDisplayData(blog)

  return (
    <div className="group block bg-card hover:bg-muted/30 transition-colors duration-200 border-b border-border/50 last:border-0">
      <div className="px-4 py-3 sm:px-6 flex items-center gap-4">
        {/* Date/Status - Fixed width */}
        <div className="hidden sm:flex w-28 flex-shrink-0 text-[11px] font-bold text-muted-foreground/60 uppercase items-center gap-2">
          {data.dateDisplay.split(' (')[0].split('に')[0]} {/* Simple date display for compact */}
          {!data.isPublished && (
            <Badge variant="outline" className="text-[9px] h-3 px-1 border-primary/30 text-primary font-black">
              D
            </Badge>
          )}
        </div>

        {/* Title & Tags */}
        <div className="flex-1 min-w-0">
          <Link href={`/blog/${data.id}`} className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {data.title}
            </h2>
            <div className="hidden md:flex gap-1.5 overflow-hidden">
              {data.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] font-medium text-muted-foreground/40 whitespace-nowrap">
                  #{tag}
                </span>
              ))}
            </div>
          </Link>
        </div>

        {/* Author */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block">
            by <span className="text-foreground/80 group-hover:text-primary transition-colors">{data.author.name}</span>
          </span>
          <div className="sm:hidden text-[10px] font-bold text-muted-foreground/60">
            {data.dateDisplay}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompactItem
