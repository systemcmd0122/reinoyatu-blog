"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  FilePenLine,
  List,
  Trash2, 
  ArrowRight,
  Twitter,
  Github,
  Globe,
  Heart,
  Bookmark,
  Share2
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { CommentType, CollectionWithItemsType } from "@/types"
import { NormalizedArticle } from "@/types/blog-detail"
import LikeButton from "@/components/blog/LikeButton"
import BookmarkButton from "@/components/blog/BookmarkButton"
import CommentSection from "@/components/blog/CommentSection"
import SeriesNavigation from "./SeriesNavigation"
import SeriesSidebar from "./SeriesSidebar"
import { getBlogLikeStatus } from "@/actions/like"
import { getBlogBookmarkStatus } from "@/actions/bookmark"
import { useRealtime } from "@/hooks/use-realtime"
import { shareContent } from "@/utils/share"

// Structured Sub-components
import ArticleHeader from "./detail/ArticleHeader"
import TagSection from "./detail/TagSection"
import SummarySection from "./detail/SummarySection"
import CoverImage from "./detail/CoverImage"
import ArticleContent from "./detail/ArticleContent"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BlogDetailProps {
  blog: NormalizedArticle
  isMyBlog: boolean
  currentUserId?: string
  initialComments?: CommentType[]
  collection?: CollectionWithItemsType
}

const BlogDetail: React.FC<BlogDetailProps> = ({ 
  blog, 
  isMyBlog, 
  currentUserId, 
  initialComments,
  collection
}) => {
  const [blogData, setBlogData] = useState<NormalizedArticle>(blog)
  const router = useRouter()
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>("")

  // リアルタイム購読
  const lastEvent = useRealtime<any>('blogs', {
    event: '*',
    filter: `id=eq.${blog.id}`
  })

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.eventType === 'UPDATE') {
      const updated = lastEvent.new as any
      setBlogData(prev => ({ 
        ...prev, 
        title: updated.title || prev.title,
        content: updated.content || prev.content,
        cover_image_url: updated.image_url !== undefined ? updated.image_url : prev.cover_image_url,
        ai_summary: updated.summary !== undefined ? updated.summary : prev.ai_summary,
        updated_at: updated.updated_at || prev.updated_at,
        reading_time: Math.ceil((updated.content?.length || 0) / 400) || 1,
      }))
    } else if (lastEvent.eventType === 'DELETE') {
      toast.error("この記事は削除されました")
      router.push("/")
    }
  }, [lastEvent, router])

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // 見出しの抽出
  useEffect(() => {
    const rawHeadings = blogData.content.match(/^#{1,3}\s+.+$/gm) || []
    const parsedHeadings = rawHeadings.map(heading => {
      const level = heading.match(/^#+/)?.[0].length || 0
      const text = heading.replace(/^#+\s+/, "")
      const id = text.replace(/\s+/g, "-").toLowerCase()
      return { id, text, level }
    })
    setHeadings(parsedHeadings)
  }, [blogData.content])

  // 目次のハイライト
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "0px 0px -80% 0px" }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])
  
  const [sharedLikeState, setSharedLikeState] = useState<{
    isLiked: boolean
    likesCount: number
  }>({
    isLiked: false,
    likesCount: blogData.likes_count || 0,
  })
  
  const [sharedBookmarkState, setSharedBookmarkState] = useState<{
    isBookmarked: boolean
  }>({
    isBookmarked: false,
  })

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUserId) return

      try {
        const { isLiked } = await getBlogLikeStatus({ 
          blogId: blog.id, 
          userId: currentUserId 
        })
        setSharedLikeState({
          isLiked,
          likesCount: blogData.likes_count || 0,
        })
      } catch (error) {
        console.error("いいね状態の取得に失敗しました", error)
      }

      try {
        const { isBookmarked } = await getBlogBookmarkStatus({ 
          blogId: blog.id, 
          userId: currentUserId 
        })
        setSharedBookmarkState({
          isBookmarked,
        })
      } catch (error) {
        console.error("ブックマーク状態の取得に失敗しました", error)
      }
    }

    fetchInitialData()
  }, [blog.id, currentUserId, blogData.likes_count])

  const handleDelete = () => {
    setIsDeletePending(true)
    setError("")

    startTransition(async () => {
      try {
        const res = await deleteBlog({
          blogId: blog.id,
          imageUrl: blogData.cover_image_url,
          userId: blogData.user_id,
        })

        if (res?.error) {
          setError(res.error)
          setIsDeletePending(false)
          return
        }

        toast.success("ブログを削除しました")
        router.push("/")
        router.refresh()
      } catch (error) {
        console.error(error)
        setError("エラーが発生しました")
        setIsDeletePending(false)
      }
    })
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background pb-20">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[var(--z-progress)] bg-transparent">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 sm:p-10">
                {/* 1. ArticleHeader (Author, Dates, Reading Time, Title) */}
                <ArticleHeader 
                  author={blogData.author}
                  authors={blogData.authors}
                  createdAt={blogData.created_at}
                  updatedAt={blogData.updated_at}
                  readingTime={blogData.reading_time}
                  title={blogData.title}
                />

                {/* 2. TagSection */}
                <TagSection tags={blogData.tags} />

                {/* 3. SummarySection */}
                <SummarySection summary={blogData.ai_summary} />

                {/* 4. CoverImage */}
                <CoverImage url={blogData.cover_image_url} title={blogData.title} />

                {/* 5. ArticleContent */}
                <ArticleContent content={blogData.content} />

                {/* Series Navigation */}
                {collection && (
                  <SeriesNavigation 
                    collection={collection}
                    currentIndex={collection.collection_items.findIndex(item => item.blog_id === blog.id)}
                    totalCount={collection.collection_items.length}
                    prevPost={(() => {
                      const idx = collection.collection_items.findIndex(item => item.blog_id === blog.id)
                      return idx > 0 ? (collection.collection_items[idx-1].blogs as any) : null
                    })()}
                    nextPost={(() => {
                      const idx = collection.collection_items.findIndex(item => item.blog_id === blog.id)
                      return idx < collection.collection_items.length - 1 ? (collection.collection_items[idx+1].blogs as any) : null
                    })()}
                  />
                )}

                {/* Article Footer Actions */}
                <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <LikeButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      initialLikesCount={blogData.likes_count}
                      showLabel={true}
                      sharedState={sharedLikeState}
                      onStateChange={setSharedLikeState}
                      initialIsLoaded={true}
                    />
                    <BookmarkButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      showLabel={true}
                      sharedState={sharedBookmarkState}
                      onStateChange={setSharedBookmarkState}
                      initialIsLoaded={true}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary gap-2 font-bold px-3"
                      onClick={() => shareContent({
                        title: blogData.title,
                        url: window.location.href
                      })}
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">共有</span>
                    </Button>
                  </div>

                  {isMyBlog && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/blog/${blog.id}/edit`}>
                          <FilePenLine className="h-4 w-4 mr-2" />
                          編集
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-2" />
                            削除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDelete}
                              className={buttonVariants({ variant: "destructive" })}
                              disabled={isDeletePending}
                            >
                              削除する
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <div className="mt-8 bg-card rounded-2xl border border-border p-6 sm:p-10 shadow-sm">
              <CommentSection
                blogId={blog.id}
                currentUserId={currentUserId}
                initialComments={initialComments}
              />
            </div>
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-[350px] flex-shrink-0 space-y-6">
            {/* Series Sidebar */}
            {collection && (
              <SeriesSidebar collection={collection} currentBlogId={blog.id} />
            )}

            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="hidden lg:block sticky top-20 z-[var(--z-sticky)] bg-card rounded-2xl border border-border shadow-sm overflow-hidden max-h-[calc(100vh-120px)] flex flex-col">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm uppercase tracking-wider">目次</h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <nav className="space-y-1">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={cn(
                          "block py-2 text-sm transition-all hover:text-primary leading-tight",
                          heading.level === 1 ? "font-bold" : 
                          heading.level === 2 ? "pl-4 text-muted-foreground" : 
                          "pl-8 text-muted-foreground text-xs",
                          activeId === heading.id && "text-primary border-l-2 border-primary pl-[14px] bg-primary/5"
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById(heading.id)?.scrollIntoView({
                            behavior: "smooth"
                          })
                        }}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            )}

            {/* Author Profile Card */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="h-20 bg-gradient-to-br from-primary/10 to-secondary/10" />
              <div className="px-6 pb-6">
                <div className="relative -mt-10 mb-4">
                  <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                    <AvatarImage src={blogData.author.avatar_url || "/default.png"} className="object-cover" />
                    <AvatarFallback>{blogData.author.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-xl font-bold mb-1">
                  <Link href={`/profile/${blogData.author.id}`} className="hover:underline">
                    {blogData.author.name}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  @{blogData.author.name}
                </p>
                {blogData.author.introduce && (
                  <p className="text-sm text-foreground/80 line-clamp-3 mb-6">
                    {blogData.author.introduce}
                  </p>
                )}
                
                <Button variant="outline" className="w-full rounded-md font-bold" asChild>
                  <Link href={`/profile/${blogData.author.id}`}>
                    プロフィールを見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                {/* Social Links */}
                {((blogData.author.social_links && Object.keys(blogData.author.social_links).length > 0) || blogData.author.homepage_url) && (
                  <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-border">
                    {blogData.author.homepage_url && (
                      <a href={blogData.author.homepage_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    {blogData.author.social_links?.twitter && (
                      <a href={blogData.author.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {blogData.author.social_links?.github && (
                      <a href={blogData.author.social_links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Github className="h-5 w-5" />
                      </a>
                    )}
                    {/* Add more social links as needed */}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default BlogDetail
