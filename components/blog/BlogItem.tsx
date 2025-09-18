"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatJST } from "@/utils/date"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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
  const [imageLoaded, setImageLoaded] = React.useState(false)

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/profile/${blog.profiles.id}`
  }

  return (
    <Link href={`/blog/${blog.id}`} className="block group">
      <Card className={cn(
        "relative w-full h-full overflow-hidden bg-card/50 backdrop-blur-sm",
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* コンテンツ部分 */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
          {/* 上部: 著者情報 */}
          <div className="flex-grow">
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {blog.tags.slice(0, 2).map(tag => (
                  <Badge key={tag.name} variant="secondary" className="text-xs backdrop-blur-sm bg-white/10 text-white border-none font-normal">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 下部: タイトルと著者 */}
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