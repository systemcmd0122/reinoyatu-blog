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
import { Filter, SortDesc, Sparkles, TrendingUp } from "lucide-react"
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    fetchUser()
  }, [])

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
            profiles!user_id (id, name, avatar_url),
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

    const eventId = (lastLikeEvent as any).commit_timestamp || JSON.stringify(lastLikeEvent.new || lastLikeEvent.old)
    if (lastProcessedLikeEventId.current === eventId) return
    lastProcessedLikeEventId.current = eventId

    const like = (lastLikeEvent.new || lastLikeEvent.old) as { blog_id: string }
    const blogId = like.blog_id

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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12 py-4">
            {processedBlogs.map((blog, index) => (
              <CardItem 
                key={blog.id} 
                blog={blog} 
                priority={index < 6} 
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )
      case "magazine":
        return (
          <div className="grid grid-cols-1 gap-20 py-4">
            {processedBlogs.map((blog, index) => (
              <MagazineItem 
                key={blog.id} 
                blog={blog} 
                priority={index < 3} 
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )
      case "compact":
      case "text":
      case "list":
      default:
        const ItemComponent = mode === "compact" ? CompactItem : mode === "text" ? TextItem : ListItem
        return (
          <div className="bg-card border border-border/40 rounded-[3rem] overflow-hidden divide-y divide-border/40 shadow-premium">
            {processedBlogs.map((blog, index) => (
              <ItemComponent
                key={blog.id} 
                blog={blog} 
                priority={index < 6} 
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="space-y-10">
      {/* Control Panel */}
      <div className="sticky top-24 z-[var(--z-sticky)] bg-background/60 backdrop-blur-2xl border border-border/40 p-2 rounded-[2rem] shadow-premium flex flex-col md:flex-row items-center justify-between gap-3 mx-[-4px]">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto px-2">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-[1.25rem] h-11 transition-all active:scale-95 shadow-lg shadow-primary/20">
            <Sparkles className="h-4 w-4" />
            <span className="font-black text-sm uppercase tracking-tighter">Feed</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground/40 px-6 py-2.5 rounded-[1.25rem] h-11 transition-all grayscale cursor-not-allowed">
            <TrendingUp className="h-4 w-4" />
            <span className="font-black text-sm uppercase tracking-tighter">Trending</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end px-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-auto h-10 text-xs border-none bg-muted/50 hover:bg-muted transition-all rounded-xl px-4 font-black tracking-tight">
              <SortDesc className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/40 shadow-2xl p-2">
              <SelectItem value="newest" className="font-bold rounded-xl p-3">最新順</SelectItem>
              <SelectItem value="oldest" className="font-bold rounded-xl p-3">古い順</SelectItem>
              <SelectItem value="most_liked" className="font-bold rounded-xl p-3">人気順</SelectItem>
            </SelectContent>
          </Select>

          <ViewSwitcher currentMode={viewMode} onModeChange={changeViewMode} />
        </div>
      </div>

      {/* Main List Area */}
      {processedBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-48 bg-muted/10 border-2 border-dashed border-border/30 rounded-[3rem] text-muted-foreground">
          <div className="p-6 bg-background rounded-full shadow-xl mb-8 opacity-20">
            <Filter className="h-16 w-16" />
          </div>
          <p className="font-black text-2xl tracking-tighter text-foreground/40">No articles found.</p>
          <button
            onClick={() => setSelectedTag(null)}
            className="mt-6 text-sm text-primary hover:underline font-black uppercase tracking-widest bg-primary/5 px-6 py-2 rounded-full border border-primary/10 transition-all hover:scale-105"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + (isMounted ? 'mounted' : 'initial')}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {!isMounted ? (
                <div className="space-y-10">
                  {viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-6">
                          <Skeleton className="aspect-video w-full rounded-3xl" />
                          <div className="space-y-3">
                            <Skeleton className="h-8 w-3/4 rounded-xl" />
                            <Skeleton className="h-5 w-full rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card border border-border/40 rounded-[2.5rem] overflow-hidden divide-y divide-border/40 shadow-premium">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-10 flex gap-8">
                          <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-3/4 rounded-xl" />
                            <Skeleton className="h-5 w-full rounded-lg" />
                            <div className="flex gap-3">
                              <Skeleton className="h-6 w-24 rounded-full" />
                              <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                          </div>
                          <Skeleton className="h-32 w-48 rounded-2xl hidden sm:block" />
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
