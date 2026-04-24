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
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-[1.3]">
        {title}
      </h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              公開日
            </span>
            <span className="text-sm font-medium text-foreground/80">{formatJST(createdAt)}</span>
          </div>

          {isUpdated && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" />
                更新日
              </span>
              <span className="text-sm font-medium text-foreground/80">{formatJST(updatedAt)}</span>
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              読了時間
            </span>
            <span className="text-sm font-medium text-foreground/80">{readingTime} 分で読めます</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default ArticleHeader
