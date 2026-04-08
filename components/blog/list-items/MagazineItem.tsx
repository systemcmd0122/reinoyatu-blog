"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Clock, ArrowRight } from "lucide-react"
import { getBlogDisplayData } from "@/utils/blog-helpers"
import { BlogType } from "@/types"
import { Badge } from "@/components/ui/badge"
import BlogActionMenu from "../BlogActionMenu"

interface MagazineItemProps {
  blog: BlogType
  priority?: boolean
  currentUserId?: string | null
}

const MagazineItem: React.FC<MagazineItemProps> = ({ blog, priority, currentUserId }) => {
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
    <div className="group relative bg-card border border-border/40 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      <div className="flex flex-col lg:flex-row">
        {/* Image panel */}
        <Link
          href={`/blog/${data.id}`}
          className="relative w-full lg:w-[44%] aspect-[16/10] lg:aspect-auto lg:min-h-[340px] overflow-hidden bg-muted flex-shrink-0"
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
              <span className="text-primary/10 font-black text-6xl select-none tracking-tighter">
                REINOYATU
              </span>
            </div>
          )}

          {/* Draft badge */}
          {!data.isPublished && (
            <div className="absolute top-5 left-5 z-20">
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full shadow-md text-xs tracking-wider">
                DRAFT
              </Badge>
            </div>
          )}

          {/* Mobile: bottom gradient + tags */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:hidden pointer-events-none" />
          <div className="absolute bottom-5 left-5 z-10 lg:hidden flex flex-wrap gap-1.5">
            {data.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-widest border border-white/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>

        {/* Text panel */}
        <div className="flex-1 p-7 md:p-10 lg:p-12 flex flex-col justify-center min-w-0">
          {/* Desktop: tags + action */}
          <div className="hidden lg:flex items-start justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {data.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] bg-primary/8 px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex-shrink-0">
              <BlogActionMenu blog={blog} isOwner={currentUserId === blog.user_id} />
            </div>
          </div>

          {/* Title */}
          <Link href={`/blog/${data.id}`} className="block mb-4 group/title">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight tracking-tight group-hover/title:text-primary transition-colors line-clamp-3">
              {data.title}
            </h2>
          </Link>

          {/* Summary */}
          {data.summary && (
            <p className="text-base text-muted-foreground/80 line-clamp-3 mb-8 leading-relaxed">
              {data.summary}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Author */}
            <button
              type="button"
              className="flex items-center gap-3 cursor-pointer group/author text-left"
              onClick={handleAuthorClick}
            >
              <div className="relative h-11 w-11 rounded-2xl overflow-hidden ring-2 ring-border group-hover/author:ring-primary transition-all shadow-md">
                <Image
                  src={data.author.avatarUrl}
                  alt={data.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-black text-foreground group-hover/author:text-primary transition-colors leading-none mb-1">
                  {data.author.name}
                </p>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold leading-none">
                  Published In Story
                </p>
              </div>
            </button>

            {/* Stats + CTA */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="flex items-center gap-2 text-muted-foreground group/like">
                <Heart className="h-5 w-5 transition-all group-hover/like:text-rose-500 group-hover/like:fill-rose-500" />
                <span className="text-sm font-bold">{data.likesCount}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {data.dateDisplay}
                </span>
              </div>
              <Link
                href={`/blog/${data.id}`}
                className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
                aria-label="Read article"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MagazineItem