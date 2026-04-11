"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
    <div className="group flex flex-col bg-card border border-border/40 rounded-3xl overflow-hidden shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
      {/* Thumbnail */}
      <Link
        href={`/blog/${data.id}`}
        className="relative aspect-[16/9] overflow-hidden bg-muted block flex-shrink-0"
      >
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <span className="text-muted-foreground/10 font-black text-4xl select-none tracking-tighter">
              REINOYATU
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* Draft badge */}
        {!data.isPublished && (
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm text-foreground border-none font-bold px-2.5 py-0.5 text-[10px] tracking-widest uppercase shadow-sm"
            >
              DRAFT
            </Badge>
          </div>
        )}

        {/* Read more indicator */}
        <div className="absolute bottom-4 right-4 z-10 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-xl">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 p-6 md:p-8 flex flex-col">
        {/* Tags & Action */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-2 min-w-0">
            {data.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-lg border border-primary/10 truncate max-w-[120px]"
              >
                #{tag}
              </span>
            ))}
            {data.tags.length > 2 && (
              <span className="text-[10px] font-bold text-muted-foreground/40 self-center uppercase tracking-widest">
                +{data.tags.length - 2}
              </span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
            <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
          </div>
        </div>

        {/* Title */}
        <Link href={`/blog/${data.id}`} className="block mb-4">
          <h2 className="text-2xl font-black text-foreground leading-tight line-clamp-2 tracking-tighter group-hover:text-primary transition-colors duration-300">
            {data.title}
          </h2>
        </Link>

        {/* Summary */}
        <p className="text-[15px] text-muted-foreground/70 line-clamp-3 leading-relaxed flex-1 mb-8 font-medium">
          {data.summary || "概要はありません。"}
        </p>

        {/* Footer */}
        <div className="pt-6 border-t border-border/40 flex items-center justify-between gap-2">
          {/* Author */}
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer group/author transition-all active:scale-95 min-w-0 text-left"
            onClick={handleAuthorClick}
          >
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-border/50 group-hover/author:border-primary transition-all flex-shrink-0 shadow-sm">
              <Image
                src={data.author.avatarUrl}
                alt={data.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground group-hover/author:text-primary transition-colors truncate max-w-[120px] leading-tight mb-0.5 tracking-tight">
                {data.author.name}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-tight">
                Author
              </p>
            </div>
          </button>

          {/* Stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border/20 shadow-sm">
              <Heart className="h-4 w-4 group-hover:text-rose-500 transition-colors" />
              <span className="text-sm font-black tracking-tighter">{data.likesCount}</span>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1 text-muted-foreground/40">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {data.dateDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardItem