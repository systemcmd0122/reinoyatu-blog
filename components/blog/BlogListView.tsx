"use client"

import React, { useState, useMemo } from "react"
import { useViewMode, ViewMode } from "@/hooks/use-view-mode"
import ViewSwitcher from "./ViewSwitcher"
import CardItem from "./list-items/CardItem"
import ListItem from "./list-items/ListItem"
import CompactItem from "./list-items/CompactItem"
import MagazineItem from "./list-items/MagazineItem"
import TextItem from "./list-items/TextItem"
import { BlogType } from "@/types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Filter, SortDesc } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BlogListViewProps {
  blogs: BlogType[]
}

type SortOption = "newest" | "oldest" | "most_liked"

const BlogListView: React.FC<BlogListViewProps> = ({ blogs }) => {
  const { viewMode, changeViewMode, isMounted } = useViewMode()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("newest")

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
        // Use updated_at for activity-based sorting
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      } else if (sortBy === "most_liked") {
        return (b.likes_count || 0) - (a.likes_count || 0)
      }
      return 0
    })

    return result
  }, [blogs, selectedTag, sortBy])

  const renderItems = (mode: ViewMode) => {
    switch (mode) {
      case "card":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 py-2">
            {processedBlogs.map((blog, index) => (
              <CardItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        )
      case "magazine":
        return (
          <div className="grid grid-cols-1 gap-16 py-4">
            {processedBlogs.map((blog, index) => (
              <MagazineItem key={blog.id} blog={blog} priority={index < 3} />
            ))}
          </div>
        )
      case "compact":
        return (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
            {processedBlogs.map((blog) => (
              <CompactItem key={blog.id} blog={blog} />
            ))}
          </div>
        )
      case "text":
        return (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
            {processedBlogs.map((blog) => (
              <TextItem key={blog.id} blog={blog} />
            ))}
          </div>
        )
      case "list":
      default:
        return (
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
            {processedBlogs.map((blog, index) => (
              <ListItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Control Panel */}
      <div className="bg-card border border-border/50 p-2 rounded-[1.5rem] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1 w-full sm:w-auto px-2 py-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse mr-2" />
          <h3 className="font-black text-foreground text-sm uppercase tracking-widest truncate">
            {viewMode === 'card' ? 'Gallery' :
              viewMode === 'compact' ? 'Compact' :
                viewMode === 'magazine' ? 'Magazine' :
                  viewMode === 'text' ? 'Text Only' : 'Feed'}
            <span className="ml-2 text-muted-foreground/50 font-medium normal-case tracking-normal">
              ({processedBlogs.length} articles)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-auto h-10 text-xs border-none bg-muted/50 hover:bg-muted transition-colors rounded-xl px-4 shadow-none focus:ring-0 font-bold">
              <SortDesc className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="newest" className="font-bold">Latest Activity</SelectItem>
              <SelectItem value="oldest" className="font-bold">Oldest</SelectItem>
              <SelectItem value="most_liked" className="font-bold">Most Liked</SelectItem>
            </SelectContent>
          </Select>

          <ViewSwitcher currentMode={viewMode} onModeChange={changeViewMode} />
        </div>
      </div>

      {/* Main List Area */}
      {processedBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-muted/20 border-2 border-dashed border-border/50 rounded-[2.5rem] text-muted-foreground">
          <Filter className="h-16 w-16 mb-6 opacity-10" />
          <p className="font-bold text-xl">No articles found.</p>
          <button
            onClick={() => setSelectedTag(null)}
            className="mt-4 text-sm text-primary hover:underline font-black uppercase tracking-widest"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + (isMounted ? 'mounted' : 'initial')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              {!isMounted ? (
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm animate-pulse">
                  {[1, 2, 3].map((i) => (
                     <div key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : (
                renderItems(viewMode)
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default BlogListView
