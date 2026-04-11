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
  Share2,
  ChevronLeft
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
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
import { motion, AnimatePresence } from "framer-motion"

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

  const TOCContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className="space-y-1">
      {headings.map((heading) => {
        const item = (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "block py-3 text-sm transition-all hover:text-primary leading-tight font-bold rounded-xl px-4",
              heading.level === 1 ? "text-foreground" :
              heading.level === 2 ? "ml-4 text-muted-foreground font-medium" :
              "ml-8 text-muted-foreground text-xs font-medium",
              activeId === heading.id ? "text-primary bg-primary/5 shadow-sm" : "hover:bg-muted/50"
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
        )

        return isMobile ? (
          <SheetClose asChild key={heading.id}>
            {item}
          </SheetClose>
        ) : item
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-muted/10 dark:bg-background pb-32 relative">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-[var(--z-progress)] bg-transparent">
        <motion.div
          className="h-full bg-primary shadow-[0_0_10px_rgba(0,0,0,0.1)]"
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black text-sm uppercase tracking-[0.3em] mb-16 md:mb-24 group bg-muted/30 px-6 py-3 rounded-full hover:bg-primary/5 active:scale-95 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Feed
        </Link>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* 1. ArticleHeader (Author, Dates, Reading Time, Title) */}
              <ArticleHeader
                author={blogData.author}
                authors={blogData.authors}
                createdAt={blogData.created_at}
                updatedAt={blogData.updated_at}
                readingTime={blogData.reading_time}
                title={blogData.title}
              />

              <div className="space-y-12">
                {/* 2. TagSection */}
                <TagSection tags={blogData.tags} />

                {/* 3. SummarySection */}
                <SummarySection summary={blogData.ai_summary} />

                {/* 4. CoverImage */}
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40">
                  <CoverImage url={blogData.cover_image_url} title={blogData.title} />
                </div>

                {/* 5. ArticleContent */}
                <div className="bg-card rounded-[3.5rem] border border-border/40 p-8 md:p-20 shadow-premium relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5" />
                  <ArticleContent content={blogData.content} />
                </div>
              </div>

              {/* Series Navigation */}
              {collection && (
                <div className="mt-16">
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
                </div>
              )}

              {/* Article Footer Actions */}
              <div className="mt-16 pt-12 border-t border-border/50 flex flex-col md:flex-row gap-6 justify-between items-center bg-card/50 p-8 rounded-[2rem] border border-border/40">
                <div className="flex items-center gap-6">
                  <div className="p-1 bg-background rounded-2xl shadow-sm border border-border/30">
                    <LikeButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      initialLikesCount={blogData.likes_count}
                      showLabel={true}
                      sharedState={sharedLikeState}
                      onStateChange={setSharedLikeState}
                      initialIsLoaded={true}
                    />
                  </div>
                  <div className="p-1 bg-background rounded-2xl shadow-sm border border-border/30">
                    <BookmarkButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      showLabel={true}
                      sharedState={sharedBookmarkState}
                      onStateChange={setSharedBookmarkState}
                      initialIsLoaded={true}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-muted-foreground hover:text-primary gap-3 font-black rounded-2xl px-6 hover:bg-primary/5"
                    onClick={() => shareContent({
                      title: blogData.title,
                      url: window.location.href
                    })}
                  >
                    <Share2 className="h-5 w-5" />
                    <span>共有する</span>
                  </Button>
                </div>

                {isMyBlog && (
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="lg" className="rounded-2xl font-black px-8 border-2" asChild>
                      <Link href={`/blog/${blog.id}/edit`}>
                        <FilePenLine className="h-5 w-5 mr-3 text-primary" />
                        編集する
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="lg" className="rounded-2xl font-black text-destructive hover:text-destructive hover:bg-destructive/10 px-8">
                          <Trash2 className="h-5 w-5 mr-3" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2.5rem] p-10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-3xl font-black tracking-tighter">記事を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription className="text-lg font-medium">
                            この操作は取り消せません。あなたの素晴らしい言葉が失われてしまいます。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 gap-4">
                          <AlertDialogCancel className="rounded-2xl h-14 font-bold border-2">キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl h-14 font-black")}
                            disabled={isDeletePending}
                          >
                            削除を確定する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </article>

            {/* Comments Section */}
            <div className="mt-16 bg-card rounded-[3rem] border border-border/40 p-8 md:p-16 shadow-premium">
              <div className="mb-12 flex items-center gap-4">
                <div className="w-2 h-8 bg-primary rounded-full" />
                <h2 className="text-3xl font-black tracking-tighter">Comments</h2>
              </div>
              <CommentSection
                blogId={blog.id}
                currentUserId={currentUserId}
                initialComments={initialComments}
              />
            </div>
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-[380px] flex-shrink-0 space-y-10">
            {/* Series Sidebar */}
            {collection && (
              <div className="animate-in slide-in-from-right-8 duration-700 delay-200">
                <SeriesSidebar collection={collection} currentBlogId={blog.id} />
              </div>
            )}

            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="hidden lg:block sticky top-24 z-[var(--z-sticky)] bg-background/40 backdrop-blur-2xl rounded-[2.5rem] border border-border/40 shadow-premium overflow-hidden max-h-[calc(100vh-140px)] flex flex-col animate-in slide-in-from-right-8 duration-700 delay-300">
                <div className="p-8 border-b border-border/40 bg-muted/20 flex items-center gap-4">
                  <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
                    <List className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-black text-[10px] uppercase tracking-[0.25em] text-foreground/50">Table of Contents</h2>
                </div>
                <ScrollArea className="flex-1 p-6">
                  <TOCContent />
                </ScrollArea>
              </div>
            )}

            {/* Author Profile Card */}
            <div className="bg-card rounded-[2.5rem] border border-border/40 shadow-premium overflow-hidden animate-in slide-in-from-right-8 duration-700 delay-400">
              <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-indigo-500/10" />
              <div className="px-8 pb-10">
                <div className="relative -mt-16 mb-6">
                  <Avatar className="h-28 w-28 border-4 border-card shadow-2xl">
                    <AvatarImage src={blogData.author.avatar_url || "/default.png"} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black">{blogData.author.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-2xl font-black mb-1 tracking-tight">
                  <Link href={`/profile/${blogData.author.id}`} className="hover:text-primary transition-colors">
                    {blogData.author.name}
                  </Link>
                </h3>
                <p className="text-sm font-bold text-muted-foreground mb-6 opacity-60">
                  @{blogData.author.name}
                </p>
                {blogData.author.introduce && (
                  <p className="text-[15px] text-foreground/70 line-clamp-4 mb-8 leading-relaxed font-medium">
                    {blogData.author.introduce}
                  </p>
                )}
                
                <Button size="lg" className="w-full rounded-[1.25rem] font-black group shadow-lg shadow-primary/10" asChild>
                  <Link href={`/profile/${blogData.author.id}`}>
                    View Profile
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                {/* Social Links */}
                {((blogData.author.social_links && Object.keys(blogData.author.social_links).length > 0) || blogData.author.homepage_url) && (
                  <div className="mt-8 flex flex-wrap gap-4 pt-8 border-t border-border/30">
                    {blogData.author.homepage_url && (
                      <a href={blogData.author.homepage_url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    {blogData.author.social_links?.twitter && (
                      <a href={blogData.author.social_links.twitter} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {blogData.author.social_links?.github && (
                      <a href={blogData.author.social_links.github} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <Github className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile TOC Button */}
      {headings.length > 0 && (
        <div className="fixed bottom-24 right-6 z-[var(--z-sticky)] lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="h-16 w-16 rounded-[1.5rem] shadow-2xl ring-4 ring-background bg-primary text-primary-foreground hover:scale-105 active:scale-90 transition-all">
                <List className="h-8 w-8" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[3rem] max-h-[80vh] p-0 overflow-hidden border-t-2 border-primary/20">
              <SheetHeader className="p-8 border-b border-border/40 bg-muted/20">
                <SheetTitle className="flex items-center gap-4 text-2xl font-black tracking-tighter">
                  <div className="p-2 bg-primary rounded-xl">
                    <List className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Table of Contents
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="p-6 h-full overflow-y-auto pb-20">
                <TOCContent isMobile />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}

export default BlogDetail
