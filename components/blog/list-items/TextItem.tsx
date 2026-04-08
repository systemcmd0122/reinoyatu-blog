"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, ArrowRight } from "lucide-react"
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
    <article className="group block bg-card/50 hover:bg-card transition-all duration-300 border-l-4 border-transparent hover:border-primary border-b border-border/40 last:border-b-0 hover:shadow-md">
      <div className="px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Left: meta + title + tags */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {!data.isPublished && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 font-black border-primary/50 text-primary px-1.5 py-0 rounded-md"
                >
                  DRAFT
                </Badge>
              )}
              <button
                type="button"
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAuthorClick}
                aria-label={`${data.author.name}のプロフィールを見る`}
              >
                <span className="text-xs font-bold text-foreground/70 hover:text-primary transition-colors truncate max-w-[120px]">
                  @{data.author.name}
                </span>
              </button>
              <span className="text-[10px] text-muted-foreground/30" aria-hidden="true">•</span>
              <time className="text-[11px] text-muted-foreground/60 font-bold">
                {data.dateDisplay}
              </time>
            </div>

            {/* Title */}
            <Link href={`/blog/${data.id}`} className="block group/title">
              <h2 className="text-lg sm:text-xl font-black text-foreground group-hover/title:text-primary transition-colors line-clamp-2">
                {data.title}
              </h2>
            </Link>

            {/* Tags */}
            {data.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap" aria-label="タグ">
                {data.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold text-muted-foreground/50 uppercase"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: likes + action menu + arrow */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0 justify-between sm:justify-end w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-500 transition-colors">
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-bold" aria-label={`${data.likesCount}いいね`}>{data.likesCount}</span>
            </div>
            <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
            <Link
              href={`/blog/${data.id}`}
              className="hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-300"
              aria-label="記事を読む"
            >
              <ArrowRight className="h-5 w-5 text-primary/70 group-hover:text-primary" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default TextItem