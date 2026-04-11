import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface TagSectionProps {
  tags: string[]
}

const TagSection: React.FC<TagSectionProps> = ({ tags }) => {
  if (!tags || tags.length === 0) return null

  return (
    <section className="flex flex-wrap gap-3 mb-16" aria-label="タグ">
      {tags.map((tag) => (
        <Link href={`/tags/${tag}`} key={tag}>
          <Badge 
            variant="secondary" 
            className="px-4 py-1.5 rounded-xl bg-muted/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-none shadow-sm cursor-pointer font-black text-xs tracking-widest uppercase"
          >
            #{tag}
          </Badge>
        </Link>
      ))}
    </section>
  )
}

export default TagSection
