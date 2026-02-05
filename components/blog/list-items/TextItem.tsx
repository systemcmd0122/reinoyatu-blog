"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart, User, ArrowRight } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"

interface TextItemProps {
  blog: BlogType
}

const TextItem: React.FC<TextItemProps> = ({ blog }) => {
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
    <div className="group block bg-card hover:bg-muted/30 transition-all duration-300 border-l-4 border-transparent hover:border-primary border-b border-border/50 last:border-b-0">
      <div className="px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
               {!data.isPublished && (
                <Badge variant="outline" className="text-[10px] h-4 font-black border-primary text-primary px-1.5 py-0">
                  DRAFT
                </Badge>
              )}
              <div 
                className="flex items-center gap-2 cursor-pointer group/author" 
                onClick={handleAuthorClick}
              >
                <div className="bg-muted rounded-full p-1 group-hover/author:bg-primary/20 transition-colors">
                  <User className="h-3 w-3 text-muted-foreground group-hover/author:text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover/author:text-primary transition-colors truncate max-w-[120px]">
                  {data.author.name}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/30">•</span>
              <span className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                {data.dateDisplay}
              </span>
            </div>

            <Link href={`/blog/${data.id}`} className="block group/title">
              <h2 className="text-lg sm:text-xl font-black text-foreground group-hover/title:text-primary transition-colors truncate">
                {data.title}
              </h2>
            </Link>
            
            {/* Minimal Tags */}
            {data.tags.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {data.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-4 w-4 fill-none" />
              <span className="text-sm font-black">{data.likesCount}</span>
            </div>
            <Link href={`/blog/${data.id}`} className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="h-5 w-5 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextItem
