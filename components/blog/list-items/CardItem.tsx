"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart, Clock, ChevronRight } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"
import BlogActionMenu from "../BlogActionMenu"

interface CardItemProps {
  blog: BlogType
  priority?: boolean
  currentUserId?: string | null
}

const CardItem: React.FC<CardItemProps> = ({ blog, priority, currentUserId }) => {
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
    <div className="group flex flex-col bg-card border border-border/40 rounded-[2rem] overflow-hidden shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full relative">
      {/* Thumbnail */}
      <Link href={`/blog/${data.id}`} className="relative aspect-[16/10] overflow-hidden bg-muted block">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 text-muted-foreground/10 font-black text-4xl select-none tracking-tighter">
            REINOYATU
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {!data.isPublished && (
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-xl text-foreground border-none font-black px-3 py-1 text-[10px] tracking-widest uppercase">
              DRAFT
            </Badge>
          </div>
        )}

        {/* Read more indicator on hover */}
        <div className="absolute bottom-4 right-4 z-10 translate-x-10 group-hover:translate-x-0 transition-transform duration-500">
           <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md p-2 rounded-full shadow-xl">
             <ChevronRight className="h-5 w-5 text-primary" />
           </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 p-6 md:p-8 flex flex-col">
        {/* Header (Tags & Action) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {data.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[11px] font-black text-primary/70 uppercase tracking-[0.1em] bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/5">
                #{tag}
              </span>
            ))}
            {data.tags.length > 2 && (
              <span className="text-[11px] font-bold text-muted-foreground/50 px-1 py-1">
                +{data.tags.length - 2}
              </span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
          </div>
        </div>

        {/* Title */}
        <Link href={`/blog/${data.id}`} className="block mb-4 group-hover:text-primary transition-colors duration-300">
          <h2 className="text-2xl font-black text-foreground leading-[1.2] line-clamp-2 tracking-tight h-[2.4em]">
            {data.title}
          </h2>
        </Link>

        {/* Summary */}
        <p className="text-[15px] text-muted-foreground line-clamp-3 mb-6 leading-relaxed font-medium opacity-80">
          {data.summary || "概要はありません。"}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-border/30 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group/author transition-all active:scale-95"
            onClick={handleAuthorClick}
          >
            <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-border/50 group-hover/author:border-primary group-hover/author:shadow-lg transition-all">
              <Image
                src={data.author.avatarUrl}
                alt={data.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-foreground group-hover/author:text-primary transition-colors truncate max-w-[120px] leading-none mb-0.5">
                {data.author.name}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                Author
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/20">
              <Heart className="h-4 w-4 transition-colors group-hover:text-rose-500 group-hover:fill-rose-500" />
              <span className="text-xs font-black">{data.likesCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground/40">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                {data.dateDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardItem
