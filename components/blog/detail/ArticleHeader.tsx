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
    <header className="mb-20 space-y-10 animate-in max-w-3xl mx-auto">
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground leading-[1.15] tracking-tight text-balance">
        {title}
      </h1>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
        {/* Author Info */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-1.5">
            {displayAuthors.map((auth) => (
              <Link key={auth.id} href={`/profile/${auth.id}`}>
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm hover:scale-110 transition-all duration-300">
                  <AvatarImage src={auth.avatar_url || "/default.png"} className="object-cover" />
                  <AvatarFallback className="font-bold">{auth.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2">
              {displayAuthors.map((auth, i) => (
                <React.Fragment key={auth.id}>
                  <Link href={`/profile/${auth.id}`} className="text-sm font-bold hover:text-primary transition-colors">
                    {auth.name}
                  </Link>
                  {i < displayAuthors.length - 1 && <span className="text-muted-foreground font-bold opacity-30">/</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[12px] font-medium">{formatJST(createdAt)}</span>
              </div>
              {isUpdated && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span className="text-[12px] font-medium">更新: {formatJST(updatedAt)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[12px] font-medium">{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Count Meta - Subtle */}
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span className="text-xs font-bold">{viewCount.toLocaleString()}</span>
        </div>
      </div>
    </header>
  )
}

export default ArticleHeader
