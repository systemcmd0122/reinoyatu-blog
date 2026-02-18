import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface TagSectionProps {
  tags: string[]
}

const TagSection: React.FC<TagSectionProps> = ({ tags }) => {
  if (!tags || tags.length === 0) return null

  return (
    <section className="flex flex-wrap gap-2 mb-10" aria-label="タグ">
      {tags.map((tag) => (
        <Link href={`/tags/${tag}`} key={tag}>
          <Badge
            variant="secondary"
            className="px-3 py-1 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-none shadow-none cursor-pointer font-medium"
          >
            #{tag}
          </Badge>
        </Link>
      ))}
    </section>
  )
}

export default TagSection
