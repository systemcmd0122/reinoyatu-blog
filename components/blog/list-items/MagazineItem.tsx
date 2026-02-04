"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart, MessageSquare, Clock } from "lucide-react"
import { formatRelativeTime } from "@/utils/date"
import { BlogType } from "@/types"

interface MagazineItemProps {
  blog: BlogType
  priority?: boolean
}

const MagazineItem: React.FC<MagazineItemProps> = ({ blog, priority }) => {
  const router = useRouter()

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${blog.profiles.id}`)
  }

  const relativeTime = formatRelativeTime(blog.updated_at)

  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      <div className="flex flex-col md:flex-row h-full">
        {/* Visual Content */}
        <Link 
          href={`/blog/${blog.id}`} 
          className="relative w-full md:w-2/5 aspect-[16/10] md:aspect-auto overflow-hidden bg-muted"
        >
          {blog.image_url ? (
            <Image
              src={blog.image_url}
              alt={blog.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-primary/20 font-black text-4xl select-none">
              REINOYATU
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:hidden" />
          
          <div className="absolute bottom-4 left-4 md:hidden">
             <div className="flex flex-wrap gap-2">
              {blog.tags?.slice(0, 3).map((tag) => (
                <span key={tag.name} className="px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground uppercase tracking-widest">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </Link>

        {/* Text Content */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
          <div className="hidden md:flex flex-wrap gap-3 mb-6">
            {blog.tags?.slice(0, 3).map((tag) => (
              <span key={tag.name} className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                #{tag.name}
              </span>
            ))}
          </div>

          <Link href={`/blog/${blog.id}`} className="block group/title">
            <h2 className="text-2xl md:text-4xl font-black text-foreground mb-4 leading-tight tracking-tighter group-hover/title:text-primary transition-colors line-clamp-2">
              {blog.title}
            </h2>
          </Link>

          {blog.summary && (
            <p className="text-base md:text-lg text-muted-foreground line-clamp-2 md:line-clamp-3 mb-8 leading-relaxed font-medium">
              {blog.summary}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group/author" 
              onClick={handleAuthorClick}
            >
              <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-border group-hover/author:ring-primary transition-all">
                <Image
                  src={blog.profiles?.avatar_url || "/default.png"}
                  alt={blog.profiles?.name || "User"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground group-hover/author:text-primary transition-colors">
                  {blog.profiles?.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Author
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground group/stat">
                <Heart className="h-5 w-5 transition-colors group-hover/stat:text-rose-500 group-hover/stat:fill-rose-500" />
                <span className="text-sm font-bold">{blog.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{relativeTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MagazineItem
