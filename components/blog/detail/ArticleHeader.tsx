import React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Calendar, RefreshCcw, User, Eye } from "lucide-react"
import { formatJST } from "@/utils/date"
import { motion } from "framer-motion"

interface ArticleHeaderProps {
  author: {
    id: string
    name: string
    avatar_url: string | null
  }
  authors?: {
    id: string
    name: string
    avatar_url: string | null
    role: 'owner' | 'editor'
  }[]
  createdAt: string
  updatedAt: string
  readingTime: number
  viewCount?: number
  title: string
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  author,
  authors,
  createdAt,
  updatedAt,
  readingTime,
  viewCount = 0,
  title,
}) => {
  const displayAuthors = authors && authors.length > 0 ? authors : [
    { ...author, role: 'owner' as const }
  ]

  const isUpdated = createdAt !== updatedAt

  return (
    <header className="mb-16 space-y-10 animate-in">
      {/* Meta Info Pill */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-full flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">{formatJST(createdAt)}</span>
        </div>
        {isUpdated && (
          <div className="px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-full flex items-center gap-2">
            <RefreshCcw className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">更新: {formatJST(updatedAt)}</span>
          </div>
        )}
        <div className="px-3 py-1 bg-muted rounded-full flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">{readingTime} min read</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground leading-[1.1] tracking-tight text-balance">
        {title}
      </h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4 border-t border-border/40">
        {/* Author Info */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {displayAuthors.map((auth) => (
              <Link key={auth.id} href={`/profile/${auth.id}`}>
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm transition-all">
                  <AvatarImage src={auth.avatar_url || "/default.png"} className="object-cover" />
                  <AvatarFallback className="font-bold">{auth.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <User className="h-3 w-3" />
              著者
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {displayAuthors.map((auth, i) => (
                <React.Fragment key={auth.id}>
                  <Link href={`/profile/${auth.id}`} className="text-base font-bold hover:text-primary transition-colors">
                    {auth.name}
                  </Link>
                  {i < displayAuthors.length - 1 && <span className="text-muted-foreground font-bold opacity-30">/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* View Count Meta */}
        <div className="flex items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-full">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Views</span>
              <span className="text-sm font-black text-foreground leading-none">{viewCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default ArticleHeader
