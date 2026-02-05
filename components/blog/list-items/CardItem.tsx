"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"

interface CardItemProps {
  blog: BlogType
  priority?: boolean
}

const CardItem: React.FC<CardItemProps> = ({ blog, priority }) => {
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
    <div className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full">
      {/* Thumbnail */}
      <Link href={`/blog/${data.id}`} className="relative aspect-video overflow-hidden bg-muted">
        {data.imageUrl ? (
          <Image
            src={data.imageUrl}
            alt={data.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 text-muted-foreground/20 font-black text-2xl select-none">
            REINOYATU
          </div>
        )}
        
        {!data.isPublished && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground border-none font-bold">
              DRAFT
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {data.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <Link href={`/blog/${data.id}`} className="block mb-2 group-hover:text-primary transition-colors">
          <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
            {data.title}
          </h2>
        </Link>

        {/* Summary */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium">
          {data.summary || "概要はありません。"}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group/author" 
            onClick={handleAuthorClick}
          >
            <div className="relative h-7 w-7 rounded-full overflow-hidden border border-border group-hover/author:border-primary transition-colors">
              <Image
                src={data.author.avatarUrl}
                alt={data.author.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground group-hover/author:text-primary transition-colors truncate max-w-[100px]">
              {data.author.name}
            </span>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-4 w-4 transition-colors group-hover:text-rose-500 group-hover:fill-rose-500" />
              <span className="text-xs font-bold">{data.likesCount}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter whitespace-nowrap">
              {data.dateDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardItem
