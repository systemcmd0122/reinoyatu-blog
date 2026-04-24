"use client"

import React, { useState, useMemo, useEffect } from "react"
import ListItem from "./list-items/ListItem"
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
import { SortDesc } from "lucide-react"

interface BlogListViewProps {
  blogs: BlogType[]
}

type SortOption = "newest" | "oldest" | "most_liked"

const BlogListView: React.FC<BlogListViewProps> = ({ blogs: initialBlogs }) => {
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

  return (
    <div className="space-y-8">
      {/* Simple Control Panel */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="text-sm font-bold text-muted-foreground">
          {processedBlogs.length} 件の記事
        </div>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-auto h-9 text-xs border-none bg-muted/50 hover:bg-muted transition-all rounded-md px-3 font-bold">
              <SortDesc className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="並び替え" />
            </SelectTrigger>
            <SelectContent className="rounded-md border-border/40 shadow-xl p-1">
              <SelectItem value="newest" className="font-bold rounded-sm text-xs">最新順</SelectItem>
              <SelectItem value="oldest" className="font-bold rounded-sm text-xs">古い順</SelectItem>
              <SelectItem value="most_liked" className="font-bold rounded-sm text-xs">人気順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main List Area */}
      {processedBlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-muted/5 border border-dashed rounded-xl text-muted-foreground">
          <p className="font-bold text-lg">記事が見つかりませんでした。</p>
          <button
            onClick={() => setSelectedTag(null)}
            className="mt-4 text-sm text-primary hover:underline font-bold"
          >
            フィルターをクリア
          </button>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden divide-y">
          {processedBlogs.map((blog, index) => (
            <ListItem
              key={blog.id}
              blog={blog}
              priority={index < 6}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BlogListView
