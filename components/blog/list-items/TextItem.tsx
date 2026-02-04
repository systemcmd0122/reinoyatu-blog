"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart, User } from "lucide-react"
import { formatRelativeTime } from "@/utils/date"
import { BlogType } from "@/types"

interface TextItemProps {
  blog: BlogType
}

const TextItem: React.FC<TextItemProps> = ({ blog }) => {
  const router = useRouter()

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${blog.profiles.id}`)
  }

  const relativeTime = formatRelativeTime(blog.updated_at)

  return (
    <div className="group block bg-card hover:bg-muted/20 transition-all duration-200 border-l-2 border-transparent hover:border-primary">
      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/blog/${blog.id}`} className="block">
              <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {blog.title}
              </h2>
            </Link>

            <div className="flex items-center gap-3 mt-1">
              <div
                className="flex items-center gap-1.5 cursor-pointer group/author"
                onClick={handleAuthorClick}
              >
                <div className="bg-muted rounded-full p-0.5 group-hover/author:bg-primary/20 transition-colors">
                  <User className="h-3 w-3 text-muted-foreground group-hover/author:text-primary" />
                </div>
                <span className="text-xs text-muted-foreground group-hover/author:text-primary truncate max-w-[100px]">
                  {blog.profiles?.name}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/60">•</span>
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                {relativeTime}
              </span>

              {/* Desktop Tags - very minimal */}
              <div className="hidden md:flex items-center gap-2 ml-4">
                {blog.tags?.slice(0, 2).map((tag) => (
                  <span key={tag.name} className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
             <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 fill-none" />
              <span className="text-xs font-bold">{blog.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextItem
