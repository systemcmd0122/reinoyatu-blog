"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart, Clock, ArrowRight } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"

interface MagazineItemProps {
  blog: BlogType
  priority?: boolean
}

const MagazineItem: React.FC<MagazineItemProps> = ({ blog, priority }) => {
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
    <div className="group relative bg-card border border-border/50 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Visual Content */}
        <Link 
          href={`/blog/${data.id}`} 
          className="relative w-full lg:w-[45%] aspect-[16/10] lg:aspect-auto overflow-hidden bg-muted"
        >
          {data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 text-primary/10 font-black text-6xl select-none tracking-tighter">
              REINOYATU
            </div>
          )}
          
          {/* Status Overlay */}
          {!data.isPublished && (
            <div className="absolute top-6 left-6 z-20">
              <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 rounded-full shadow-lg">
                DRAFT
              </Badge>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 lg:hidden" />
          
          <div className="absolute bottom-6 left-6 lg:hidden">
             <div className="flex flex-wrap gap-2">
              {data.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-primary text-[10px] font-black text-primary-foreground uppercase tracking-[0.2em]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>

        {/* Text Content */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="hidden lg:flex flex-wrap gap-4 mb-8">
            {data.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs font-black text-primary uppercase tracking-[0.3em] bg-primary/5 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          <Link href={`/blog/${data.id}`} className="block group/title mb-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-[1.1] tracking-tighter group-hover/title:text-primary transition-colors line-clamp-2">
              {data.title}
            </h2>
          </Link>

          {data.summary && (
            <p className="text-lg text-muted-foreground line-clamp-3 mb-10 leading-relaxed font-medium">
              {data.summary}
            </p>
          )}

          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div 
              className="flex items-center gap-4 cursor-pointer group/author" 
              onClick={handleAuthorClick}
            >
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden ring-2 ring-border group-hover/author:ring-primary transition-all shadow-md rotate-3 group-hover:rotate-0">
                <Image
                  src={data.author.avatarUrl}
                  alt={data.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-foreground group-hover/author:text-primary transition-colors">
                  {data.author.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                  Published In Story
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5 text-muted-foreground group/stat">
                <Heart className="h-6 w-6 transition-all group-hover/stat:text-rose-500 group-hover/stat:fill-rose-500 group-hover/stat:scale-110" />
                <span className="text-sm font-black tracking-tight">{data.likesCount}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="text-[11px] font-black uppercase tracking-widest">{data.dateDisplay}</span>
              </div>
              <Link href={`/blog/${data.id}`} className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MagazineItem
