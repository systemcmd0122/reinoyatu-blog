import React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock } from "lucide-react"
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

  return (
    <header className="mb-8">
      {/* Author Info */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex -space-x-3">
          {displayAuthors.map((auth) => (
            <Link key={auth.id} href={`/profile/${auth.id}`}>
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm hover:z-10 transition-transform hover:scale-110">
                <AvatarImage src={auth.avatar_url || "/default.png"} className="object-cover" />
                <AvatarFallback>{auth.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
          ))}
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
            {displayAuthors.map((auth, i) => (
              <React.Fragment key={auth.id}>
                <Link href={`/profile/${auth.id}`} className="text-sm font-bold hover:underline">
                  @{auth.name}
                </Link>
                {i < displayAuthors.length - 1 && <span className="text-sm text-muted-foreground mr-1">,</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-6">
        <div className="flex items-center gap-1">
          <span>{formatJST(createdAt)}に投稿</span>
          {createdAt !== updatedAt && (
            <span className="text-muted-foreground/70">
              (更新: {formatJST(updatedAt)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{readingTime}分で読めます</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.2]">
        {title}
      </h1>
    </header>
  )
}

export default ArticleHeader
