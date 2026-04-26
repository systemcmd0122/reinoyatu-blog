import React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Calendar, RefreshCcw, Eye } from "lucide-react"
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
    role: "owner" | "editor"
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
  const displayAuthors =
    authors && authors.length > 0
      ? authors
      : [{ ...author, role: "owner" as const }]

  const isUpdated = createdAt !== updatedAt

  return (
    <header className="mb-12">
      {/* タイトル */}
      <h1 className="mb-8 text-[1.75rem] font-bold leading-[1.4] tracking-tight text-foreground sm:text-[2rem] md:text-[2.25rem]">
        {title}
      </h1>

      {/* 著者・メタ情報 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 著者情報 */}
        <div className="flex items-center gap-3">
          {/* アバター（複数対応） */}
          <div className="flex -space-x-2">
            {displayAuthors.map((auth) => (
              <Link key={auth.id} href={`/profile/${auth.id}`} className="relative block">
                <Avatar className="h-9 w-9 border-2 border-background ring-0 transition-transform duration-200 hover:scale-110 hover:z-10">
                  <AvatarImage
                    src={auth.avatar_url || "/default.png"}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {auth.name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-0.5">
            {/* 著者名 */}
            <div className="flex flex-wrap items-center gap-1">
              {displayAuthors.map((auth, i) => (
                <React.Fragment key={auth.id}>
                  <Link
                    href={`/profile/${auth.id}`}
                    className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {auth.name}
                  </Link>
                  {i < displayAuthors.length - 1 && (
                    <span className="text-xs text-muted-foreground/40">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* 日付・読了時間 */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatJST(createdAt)}
              </span>

              {isUpdated && (
                <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  <RefreshCcw className="h-3 w-3" />
                  更新: {formatJST(updatedAt)}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* 閲覧数（デスクトップのみ） */}
        {viewCount > 0 && (
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-medium tabular-nums">
              {viewCount.toLocaleString("ja-JP")}
            </span>
          </div>
        )}
      </div>

      {/* セパレーター */}
      <div className="mt-8 h-px bg-border/60" />
    </header>
  )
}

export default ArticleHeader