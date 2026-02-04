"use client"

import React from "react"
import { useViewMode } from "@/hooks/use-view-mode"
import ViewSwitcher from "./ViewSwitcher"
import CardItem from "./list-items/CardItem"
import ListItem from "./list-items/ListItem"
import CompactItem from "./list-items/CompactItem"
import { BlogType } from "@/types"
import { cn } from "@/lib/utils"

interface BlogListViewProps {
  blogs: BlogType[]
}

const BlogListView: React.FC<BlogListViewProps> = ({ blogs }) => {
  const { viewMode, changeViewMode, isMounted } = useViewMode()

  // Prevents layout shift/flash by showing a consistent state until mounted
  // Though we use 'list' as default in hook, we can also show a placeholder if needed.

  const renderContent = () => {
    if (!isMounted) {
      // Return a skeleton or just the default list view without transitions
      return (
        <div className="bg-card border border-border rounded-b-lg overflow-hidden divide-y divide-border shadow-sm">
          {blogs.map((blog, index) => (
            <ListItem key={blog.id} blog={blog} priority={index < 6} />
          ))}
        </div>
      )
    }

    switch (viewMode) {
      case "card":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-2">
            {blogs.map((blog, index) => (
              <CardItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        )
      case "compact":
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
            {blogs.map((blog) => (
              <CompactItem key={blog.id} blog={blog} />
            ))}
          </div>
        )
      case "list":
      default:
        return (
          <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border shadow-sm">
            {blogs.map((blog, index) => (
              <ListItem key={blog.id} blog={blog} priority={index < 6} />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* List Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-1 overflow-hidden">
           <div className={cn(
             "h-1 w-8 bg-primary rounded-full mr-2",
             !isMounted && "animate-pulse"
           )} />
           <h3 className="font-bold text-foreground">
             {viewMode === 'card' ? 'ギャラリー表示' : viewMode === 'compact' ? '見出し表示' : 'フィード表示'}
           </h3>
        </div>
        
        <ViewSwitcher currentMode={viewMode} onModeChange={changeViewMode} />
      </div>

      {/* Main List Area */}
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </div>
  )
}

export default BlogListView
