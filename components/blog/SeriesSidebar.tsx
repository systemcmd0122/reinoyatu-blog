"use client"

import Link from "next/link"
import { Play, List, ChevronRight, CheckCircle2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { CollectionWithItemsType } from "@/types"

interface SeriesSidebarProps {
  collection: CollectionWithItemsType
  currentBlogId: string
}

export default function SeriesSidebar({ collection, currentBlogId }: SeriesSidebarProps) {
  const items = collection.collection_items || []

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm uppercase tracking-wider">シリーズ：{collection.title}</h2>
        </div>
        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {items.length}件
        </span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {items.map((item, index) => {
            const isActive = item.blog_id === currentBlogId
            const blog = item.blogs
            return (
              <Link 
                key={item.id} 
                href={`/blog/${blog.id}?collection=${collection.id}`}
                className={cn(
                  "flex gap-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-muted/50 border border-transparent"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                )}>
                  {isActive ? <Play className="h-3 w-3" /> : index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-bold line-clamp-2 leading-tight",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {blog.title}
                  </p>
                </div>

                {isActive && (
                  <div className="flex-shrink-0 self-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </ScrollArea>
      
      <Link 
        href={`/collections/${collection.id}`}
        className="p-3 text-[10px] font-bold text-center border-t border-border hover:bg-muted/30 transition-colors text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
      >
        シリーズ詳細ページを表示
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
