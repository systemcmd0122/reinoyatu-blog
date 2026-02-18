import React from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const MarkdownRenderer = dynamic(
  () => import("@/components/blog/markdown/MarkdownRenderer"),
  {
    ssr: false,
    loading: () => (
      <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground break-words space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  }
)

interface ArticleContentProps {
  content: string
}

const ArticleContent: React.FC<ArticleContentProps> = ({ content }) => {
  return (
    <div className="text-foreground break-words">
      <MarkdownRenderer content={content} />
    </div>
  )
}

export default ArticleContent
