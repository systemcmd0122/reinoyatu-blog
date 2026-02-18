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
  createdAt: string
  updatedAt: string
  readingTime: number
  title: string
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  author,
  createdAt,
  updatedAt,
  readingTime,
  title,
}) => {
  return (
    <header className="mb-8">
      {/* Author Info */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/profile/${author.id}`}>
          <Avatar className="h-10 w-10 border border-border shadow-sm">
            <AvatarImage src={author.avatar_url || "/default.png"} className="object-cover" />
            <AvatarFallback>{author.name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <Link href={`/profile/${author.id}`} className="text-sm font-bold hover:underline">
            @{author.name}
          </Link>
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
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.2]">
        {title}
      </h1>
    </header>
  )
}

export default ArticleHeader
