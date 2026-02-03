"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatJST } from "@/utils/date"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BlogItemProps {
  blog: {
    id: string
    title: string
    content: string
    image_url: string | null
    updated_at: string
    profiles: {
      id: string
      name: string
      avatar_url: string | null
    }
    tags?: { name: string }[]
  }
  priority?: boolean
}

const BlogItem: React.FC<BlogItemProps> = ({ blog, priority = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/profile/${blog.profiles.id}`
  }

  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/tags/${encodeURIComponent(tagName)}`
  }

  const displayedTags = showAllTags ? blog.tags : blog.tags?.slice(0, 2)
  const hasMoreTags = blog.tags && blog.tags.length > 2

  return (
    <Link href={`/blog/${blog.id}`} className="block group">
      <Card className={cn(
        "relative w-full h-full overflow-hidden bg-white",
        "border border-border/50 transition-all duration-300 ease-in-out",
        "hover:border-primary/30 hover:shadow-xl hover:-translate-y-1",
        "rounded-2xl"
      )}>
        {/* カード画像部分 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={blog.image_url || "/noImage.png"}
            alt={blog.title}
            fill
            className={cn(
              "object-cover transition-all duration-700 ease-in-out",
              "group-hover:scale-110",
              !imageLoaded && "blur-xl scale-110",
              imageLoaded && "blur-0 scale-100"
            )}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* コンテンツ部分 */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
          {/* タグ表示エリア - コンパクト化 */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-auto pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 cursor-pointer hover:bg-black/40 transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowAllTags(!showAllTags)
                      }}
                    >
                      <Tag className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {blog.tags.length}
                      </span>
                      {displayedTags?.slice(0, 1).map(tag => (
                        <span key={tag.name} className="text-xs">
                          {tag.name}
                        </span>
                      ))}
                      {hasMoreTags && !showAllTags && (
                        <span className="text-xs opacity-75">+{blog.tags.length - 1}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs p-3 bg-gray-900 border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {blog.tags.map(tag => (
                        <Badge
                          key={tag.name}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/80 transition-colors text-xs"
                          onClick={(e) => handleTagClick(e, tag.name)}
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* タイトルと著者 */}
          <div>
            <h3 className={cn(
              "text-lg font-bold text-white mb-2",
              "line-clamp-2 leading-tight tracking-tight",
              "drop-shadow-md"
            )}>
              {blog.title}
            </h3>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
              <div
                className="flex items-center gap-2 group/author transition-opacity duration-200 hover:opacity-80"
                onClick={handleAuthorClick}
                title={`${blog.profiles?.name || "Unknown User"}のプロフィールを見る`}
              >
                <div className="relative h-7 w-7 overflow-hidden rounded-full border border-white/20">
                  <Image
                    src={blog.profiles?.avatar_url || "/default.png"}
                    alt={blog.profiles?.name || "Unknown User"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-xs">
                  <div className="font-medium text-white/90 drop-shadow-sm">
                    {blog.profiles?.name || "Unknown User"}
                  </div>
                  <div className="text-white/70">
                    {formatJST(blog.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default BlogItem