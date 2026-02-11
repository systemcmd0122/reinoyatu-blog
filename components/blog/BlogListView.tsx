"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useViewMode, ViewMode } from "@/hooks/use-view-mode"
import ViewSwitcher from "./ViewSwitcher"
import CardItem from "./list-items/CardItem"
import ListItem from "./list-items/ListItem"
import CompactItem from "./list-items/CompactItem"
import MagazineItem from "./list-items/MagazineItem"
import TextItem from "./list-items/TextItem"
import { BlogType } from "@/types"
import { useRealtime } from "@/hooks/use-realtime"
import { createClient } from "@/utils/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Filter, SortDesc } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface BlogListViewProps {
  blogs: BlogType[]
}

type SortOption = "newest" | "oldest" | "most_liked"

const BlogListView: React.FC<BlogListViewProps> = ({ blogs: initialBlogs }) => {
  const { viewMode, changeViewMode, isMounted } = useViewMode()
  const [blogs, setBlogs] = useState<BlogType[]>(initialBlogs)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  // Filter and Sort blogs
  // リアルタイム購読 (ブログ本体)
  const lastBlogEvent = useRealtime<BlogType>('blogs', {
    event: '*',
    filter: 'is_published=eq.true'
  })

  useEffect(() => {
    if (!lastBlogEvent) return

    const supabase = createClient()

    const handleEvent = async () => {
      if (lastBlogEvent.eventType === 'INSERT') {
        const newBlog = lastBlogEvent.new as BlogType
        
        // 外部キーのデータを補完
        const { data: fullBlog } = await supabase
          .from('blogs')
          .select(`
            *,
            profiles (id, name, avatar_url),
            tags (name),
            likes:likes(count)
          `)
          .eq('id', newBlog.id)
          .single()
        
        if (fullBlog) {
          const blogWithLikes = {
            ...fullBlog,
            likes_count: (fullBlog as any).likes?.[0]?.count || 0
          }
          setBlogs(prev => {
            if (prev.some(b => b.id === blogWithLikes.id)) return prev
            return [blogWithLikes, ...prev]
          })
        }
      } else if (lastBlogEvent.eventType === 'UPDATE') {
        const updatedBlog = lastBlogEvent.new as BlogType
        setBlogs(prev => prev.map(b => 
          b.id === updatedBlog.id ? { ...b, ...updatedBlog } : b
        ))
      } else if (lastBlogEvent.eventType === 'DELETE') {
        setBlogs(prev => prev.filter(b => b.id !== lastBlogEvent.old.id))
      }
    }

    handleEvent()
  }, [lastBlogEvent])

  // リアルタイム購読 (いいね数)
  const lastLikeEvent = useRealtime('likes', { event: '*' })
  const lastProcessedLikeEventId = React.useRef<string | null>(null)

  useEffect(() => {
    if (!lastLikeEvent) return
    
    // 重複処理を回避 (イベントIDがあればそれを使用、なければペイロードから生成)
    const eventId = (lastLikeEvent as any).commit_timestamp || JSON.stringify(lastLikeEvent.new || lastLikeEvent.old)
    if (lastProcessedLikeEventId.current === eventId) return
    lastProcessedLikeEventId.current = eventId

    const like = (lastLikeEvent.new || lastLikeEvent.old) as { blog_id: string }
    const blogId = like.blog_id

    // リストに含まれるブログのいいね数が変わった場合のみ更新
    setBlogs(currentBlogs => {
      if (currentBlogs.some(b => b.id === blogId)) {
        const refreshBlogLike = async () => {
          const supabase = createClient()
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('blog_id', blogId)
          
          setBlogs(latestBlogs => latestBlogs.map(b => 
            b.id === blogId ? { ...b, likes_count: count || 0 } : b
          ))
        }
        
        refreshBlogLike()
      }
      return currentBlogs
    })
  }, [lastLikeEvent])

  // 初期データが変更されたら同期
  useEffect(() => {
    setBlogs(initialBlogs)
  }, [initialBlogs])

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
              <SelectItem value="newest" className="font-bold">最新順</SelectItem>
              <SelectItem value="oldest" className="font-bold">古い順</SelectItem>
              <SelectItem value="most_liked" className="font-bold">人気順</SelectItem>
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
                <div className="space-y-6">
                  {viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-4">
                          <Skeleton className="aspect-video w-full rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 flex gap-4">
                          <div className="flex-1 space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex gap-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                          <Skeleton className="h-24 w-40 rounded-lg hidden sm:block" />
                        </div>
                      ))}
                    </div>
                  )}
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
