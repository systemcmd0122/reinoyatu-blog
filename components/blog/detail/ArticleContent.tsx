import React from "react"
import MarkdownRenderer from "@/components/blog/markdown/MarkdownRenderer"

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
