"use client"

import React, { useState, useMemo } from "react"
import { useViewMode } from "@/hooks/use-view-mode"
import ViewSwitcher from "./ViewSwitcher"
import CardItem from "./list-items/CardItem"
import ListItem from "./list-items/ListItem"
import CompactItem from "./list-items/CompactItem"
import MagazineItem from "./list-items/MagazineItem"
import TextItem from "./list-items/TextItem"
import { BlogType } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Filter, SortDesc, X } from "lucide-react"

interface BlogListViewProps {
  blogs: BlogType[]
}

type SortOption = "newest" | "oldest" | "most_liked"

const BlogListView: React.FC<BlogListViewProps> = ({ blogs }) => {
  const { viewMode, changeViewMode, isMounted } = useViewMode()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    blogs.forEach(blog => {
      blog.tags?.forEach(tag => tags.add(tag.name))
    })
    return Array.from(tags).sort()
  }, [blogs])

  // Filter and Sort blogs
  const processedBlogs = useMemo(() => {
    let result = [...blogs]

    // Filtering
    if (selectedTag) {
      result = result.filter(blog =>
        blog.tags?.some(tag => tag.name === selectedTag)
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === "most_liked") {
        return (b.likes_count || 0) - (a.likes_count || 0)
      }
      return 0
    })

    return result
  }, [blogs, selectedTag, sortBy])

  const renderContent = () => {
    if (processedBlogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border rounded-xl text-muted-foreground">
          <Filter className="h-10 w-10 mb-4 opacity-20" />
          <p className="font-medium">条件に一致する記事が見つかりませんでした。</p>
          <button
            onClick={() => setSelectedTag(null)}
            className="mt-2 text-sm text-primary hover:underline font-bold"
          >
            フィルターをクリアする
          </button>
        </div>
      )
    }

    if (!isMounted) {
      return (
        <div className="bg-card border border-border rounded-b-lg overflow-hidden divide-y divide-border shadow-sm">
          {processedBlogs.map((blog, index) => (
            <ListItem key={blog.id} blog={blog} priority={index < 6} />
          ))}
        </div>
      )
    }

    switch (viewMode) {
      case "card":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-2">
            {processedBlogs.map((blog, index) => (
              <CardItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        )
      case "magazine":
        return (
          <div className="grid grid-cols-1 gap-12 py-4">
            {processedBlogs.map((blog, index) => (
              <MagazineItem key={blog.id} blog={blog} priority={index < 3} />
            ))}
          </div>
        )
      case "compact":
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
            {processedBlogs.map((blog) => (
              <CompactItem key={blog.id} blog={blog} />
            ))}
          </div>
        )
      case "text":
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
            {processedBlogs.map((blog) => (
              <TextItem key={blog.id} blog={blog} />
            ))}
          </div>
        )
      case "list":
      default:
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
            {processedBlogs.map((blog, index) => (
              <ListItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="space-y-4 bg-card/50 border border-border/50 p-4 md:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "h-1 w-8 bg-primary rounded-full flex-shrink-0",
                !isMounted && "animate-pulse"
              )} />
              <h3 className="font-bold text-foreground text-sm md:text-base truncate">
                {viewMode === 'card' ? 'ギャラリー' :
                  viewMode === 'compact' ? 'コンパクト' :
                    viewMode === 'magazine' ? 'マガジン' :
                      viewMode === 'text' ? 'テキストのみ' : 'フィード'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-start xs:justify-end">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-auto md:w-[140px] h-8 text-xs border-none bg-transparent shadow-none focus:ring-0 px-2">
                    <SortDesc className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                    <SelectValue placeholder="並び替え" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">新しい順</SelectItem>
                    <SelectItem value="oldest">古い順</SelectItem>
                    <SelectItem value="most_liked">人気順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ViewSwitcher currentMode={viewMode} onModeChange={changeViewMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </div>
    </div>
  )
}

export default BlogListView
