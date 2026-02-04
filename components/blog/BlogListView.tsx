"use client"

import React, { useState, useMemo } from "react"
import { useViewMode } from "@/hooks/use-view-mode"
import ViewSwitcher from "./ViewSwitcher"
import CardItem from "./list-items/CardItem"
import ListItem from "./list-items/ListItem"
import CompactItem from "./list-items/CompactItem"
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
      case "compact":
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
            {processedBlogs.map((blog) => (
              <CompactItem key={blog.id} blog={blog} />
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
    <div className="space-y-12">
      {/* Control Panel */}
      <div className="space-y-6 bg-card/50 border border-border/50 p-8 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <div className={cn(
               "h-1 w-8 bg-primary rounded-full",
               !isMounted && "animate-pulse"
             )} />
             <h3 className="font-bold text-foreground">
               {viewMode === 'card' ? 'ギャラリー' : viewMode === 'compact' ? 'コンパクト' : 'フィード'}
             </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[140px] h-8 text-xs border-none bg-transparent shadow-none focus:ring-0">
                  <SortDesc className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
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

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              タグで絞り込む:
            </span>
            <Badge
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer transition-all hover:bg-primary/10 hover:text-primary border-primary/20"
              onClick={() => setSelectedTag(null)}
            >
              すべて
            </Badge>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:bg-primary/10 hover:text-primary",
                  selectedTag === tag ? "" : "border-border"
                )}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors ml-2"
              >
                <X className="h-3 w-3" />
                解除
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main List Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </div>
    </div>
  )
}

export default BlogListView
