import React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Calendar, RefreshCcw, User } from "lucide-react"
import { formatJST } from "@/utils/date"

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
  title: string
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  author,
  authors,
  createdAt,
  updatedAt,
  readingTime,
  title,
}) => {
  const displayAuthors = authors && authors.length > 0 ? authors : [
    { ...author, role: 'owner' as const }
  ]

  const isUpdated = createdAt !== updatedAt

  return (
    <header className="mb-12 space-y-8">
      {/* Title */}
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.05] animate-in slide-in-from-bottom-4 duration-700">
        {title}
      </h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/50 animate-in fade-in duration-1000">
        {/* Author Info */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {displayAuthors.map((auth) => (
              <Link key={auth.id} href={`/profile/${auth.id}`}>
                <Avatar className="h-14 w-14 border-4 border-background shadow-premium hover:z-10 transition-all hover:scale-110 active:scale-95">
                  <AvatarImage src={auth.avatar_url || "/default.png"} className="object-cover" />
                  <AvatarFallback className="font-black">{auth.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              Authors
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {displayAuthors.map((auth, i) => (
                <React.Fragment key={auth.id}>
                  <Link href={`/profile/${auth.id}`} className="text-lg font-black hover:text-primary transition-colors">
                    {auth.name}
                  </Link>
                  {i < displayAuthors.length - 1 && <span className="text-muted-foreground font-black opacity-30">/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Published
            </span>
            <span className="text-sm font-bold">{formatJST(createdAt)}</span>
          </div>

          {isUpdated && (
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" />
                Updated
              </span>
              <span className="text-sm font-bold">{formatJST(updatedAt)}</span>
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Reading Time
            </span>
            <span className="text-sm font-bold">{readingTime} min read</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default ArticleHeader
