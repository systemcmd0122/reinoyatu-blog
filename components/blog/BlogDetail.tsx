"use client"

import React, { useEffect, useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  FilePenLine,
  List,
  Trash2, 
  Flag,
  Download,
  ArrowRight,
  Twitter,
  Github,
  Globe,
  Share2,
  Heart,
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
import { incrementViewCount, getRelatedBlogs } from "@/actions/blog"
import { calculateReadingTime } from "@/utils/blog-helpers"
import { useRealtime } from "@/hooks/use-realtime"
import { shareContent } from "@/utils/share"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

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
  const [scrollProgress, setScrollProgress] = useState(0)

  // スクロール進捗の計算
  useEffect(() => {
    const updateScrollProgress = () => {
      const currentScrollY = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) {
        setScrollProgress(0)
        return
      }
      const progress = Math.min(Math.max((currentScrollY / scrollHeight) * 100, 0), 100)
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", updateScrollProgress)
    return () => window.removeEventListener("scroll", updateScrollProgress)
  }, [])
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([])
  const router = useRouter()
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const tocRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})

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
        view_count: updated.view_count !== undefined ? updated.view_count : prev.view_count,
        reading_time: calculateReadingTime(updated.content || prev.content),
      }))
    } else if (lastEvent.eventType === 'DELETE') {
      toast.error("この記事は削除されました")
      router.push("/")
    }
  }, [lastEvent, router])


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

  // アクティブな目次項目をスクロール表示
  useEffect(() => {
    if (activeId && tocRefs.current[activeId]) {
      tocRefs.current[activeId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [activeId])
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

  // 閲覧数を増やす
  useEffect(() => {
    const timer = setTimeout(() => {
      incrementViewCount(blog.id)
    }, 2000) // 2秒滞在でカウント
    return () => clearTimeout(timer)
  }, [blog.id])

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

  // 関連記事を取得
  useEffect(() => {
    const fetchRelated = async () => {
      if (blog.tags && blog.tags.length > 0) {
        const { blogs: related } = await getRelatedBlogs(blog.id, blog.tags)
        setRelatedBlogs(related || [])
      }
    }
    fetchRelated()
  }, [blog.id, blog.tags])

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

  const handleExportMarkdown = () => {
    const markdownContent = `# ${blogData.title}\n\n${blogData.content}`
    const blob = new Blob([markdownContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${blogData.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Markdownをエクスポートしました")
  }

  const TOCContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className="space-y-1 px-1">
      {headings.map((heading) => {
        const item = (
          <a
            key={heading.id}
            ref={(el) => {
              tocRefs.current[heading.id] = el
            }}
            href={`#${heading.id}`}
            className={cn(
              "group relative block py-2 text-sm transition-all hover:text-primary leading-snug rounded-xl px-4",
              heading.level === 1 ? "font-bold text-foreground" :
              heading.level === 2 ? "ml-4 font-semibold text-muted-foreground text-[13px]" :
              "ml-8 font-medium text-muted-foreground text-[12px]",
              activeId === heading.id
                ? "text-primary bg-primary/5 shadow-sm ring-1 ring-primary/10"
                : "hover:bg-muted/50 text-muted-foreground/80"
            )}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById(heading.id)
              if (element) {
                const offset = 100
                const bodyRect = document.body.getBoundingClientRect().top
                const elementRect = element.getBoundingClientRect().top
                const elementPosition = elementRect - bodyRect
                const offsetPosition = elementPosition - offset

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth"
                })
              }
            }}
          >
            {activeId === heading.id && (
              <motion.div
                layoutId={isMobile ? "active-toc-indicator-mobile" : "active-toc-indicator"}
                className="absolute left-1.5 top-2 bottom-2 w-1 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{heading.text}</span>
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
    <div className="min-h-screen bg-background pb-32 relative">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[var(--z-progress)] bg-muted/30">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${scrollProgress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm uppercase tracking-wider mb-8 group"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            フィードに戻る
          </Link>
        </motion.div>

        <div className="flex flex-col items-center">
          {/* Main Content */}
          <main className="w-full max-w-4xl min-w-0">
            <article>
              {/* 4. CoverImage - Move to top for note-style impact */}
              {blogData.cover_image_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[2.5rem] overflow-hidden shadow-premium border border-border/40 mb-12"
                >
                  <CoverImage url={blogData.cover_image_url} title={blogData.title} />
                </motion.div>
              )}

              {/* 1. ArticleHeader */}
              <ArticleHeader
                author={blogData.author}
                authors={blogData.authors}
                createdAt={blogData.created_at}
                updatedAt={blogData.updated_at}
                readingTime={blogData.reading_time}
                viewCount={blogData.view_count}
                title={blogData.title}
              />

              <div className="max-w-3xl mx-auto space-y-20">
                {/* 2. TagSection */}
                <TagSection tags={blogData.tags} />

                {/* 3. SummarySection */}
                <SummarySection summary={blogData.ai_summary} />

                {/* 5. ArticleContent - Note: removed background/border for cleaner look */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden py-4"
                >
                  <ArticleContent content={blogData.content} />
                </motion.div>
              </div>

              {/* Author Profile Card - Note: Move to bottom of article */}
              <div className="max-w-3xl mx-auto mt-24 mb-16 px-4 md:px-0">
                <div className="bg-muted/30 rounded-[2.5rem] border border-border/20 overflow-hidden transition-all group/author">
                  <div className="px-8 py-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg transition-transform group-hover/author:scale-105 duration-500">
                      <AvatarImage src={blogData.author.avatar_url || "/default.png"} className="object-cover" />
                      <AvatarFallback className="text-3xl font-bold">{blogData.author.name?.[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black">
                            <Link href={`/profile/${blogData.author.id}`} className="hover:text-primary transition-colors tracking-tight">
                              {blogData.author.name}
                            </Link>
                          </h3>
                          <div className="flex gap-2">
                             {blogData.author.homepage_url && (
                              <a href={blogData.author.homepage_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background text-muted-foreground hover:text-primary transition-all border border-border/40">
                                <Globe className="h-4 w-4" />
                              </a>
                            )}
                            {blogData.author.social_links?.twitter && (
                              <a href={blogData.author.social_links.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background text-muted-foreground hover:text-primary transition-all border border-border/40">
                                <Twitter className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-muted-foreground mt-1">
                          @{blogData.author.name}
                        </p>
                      </div>

                      {blogData.author.introduce && (
                        <p className="text-sm text-foreground/70 line-clamp-3 leading-relaxed font-medium">
                          {blogData.author.introduce}
                        </p>
                      )}

                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="lg" className="rounded-2xl font-black border-border/60 hover:bg-background" asChild>
                          <Link href={`/profile/${blogData.author.id}`}>
                            プロフィールを見る
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Series Navigation */}
              {collection && (
                <div className="max-w-3xl mx-auto mt-16">
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
              <div className="max-w-3xl mx-auto mt-12 pt-8 border-t flex flex-col md:flex-row gap-6 justify-between items-center p-6">
                <div className="flex items-center gap-6">
                  <div className="bg-background rounded-md shadow-sm border border-border/30">
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
                  <div className="bg-background rounded-md shadow-sm border border-border/30">
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
                    className="text-muted-foreground hover:text-primary gap-3 font-bold rounded-md px-6"
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
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-md font-bold px-6 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={handleExportMarkdown}
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-md font-bold px-8" asChild>
                      <Link href={`/blog/${blog.id}/edit`}>
                        <FilePenLine className="h-5 w-5 mr-3 text-primary" />
                        編集する
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="lg" className="rounded-md font-bold text-destructive hover:text-destructive hover:bg-destructive/10 px-8">
                          <Trash2 className="h-5 w-5 mr-3" />
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-lg p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-bold">記事を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription className="text-base">
                            この操作は取り消せません。記事を削除してもよろしいですか？
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 gap-4">
                          <AlertDialogCancel className="rounded-md font-bold border">キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className={cn(buttonVariants({ variant: "destructive" }), "rounded-md font-bold")}
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

            {/* Related Articles */}
            {relatedBlogs.length > 0 && (
              <div className="max-w-3xl mx-auto mt-32">
                <div className="mb-12 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-2xl font-black text-foreground tracking-tight">関連記事</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {relatedBlogs.map((related) => (
                    <Link key={related.id} href={`/blog/${related.id}`} className="group flex flex-col transition-all">
                      <div className="relative aspect-[16/10] bg-muted rounded-[2rem] overflow-hidden border border-border/20 mb-6">
                        {related.image_url ? (
                          <Image src={related.image_url} alt={related.title} fill className="object-cover transition-transform group-hover:scale-105 duration-700" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xs p-4 text-center">
                            {related.title}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 px-2">
                        <h3 className="font-bold text-xl line-clamp-2 mb-4 group-hover:text-primary transition-colors leading-tight">
                          {related.title}
                        </h3>
                        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={related.profiles?.avatar_url || "/default.png"} />
                              <AvatarFallback>{related.profiles?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="opacity-70 group-hover:opacity-100 transition-opacity">{related.profiles?.name}</span>
                          </div>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
                            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                            {related.likes_count}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="max-w-3xl mx-auto mt-32">
              <div className="mb-12 flex items-center gap-4">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl font-black tracking-tight">コメント</h2>
              </div>
              <div className="bg-background rounded-[2.5rem] border border-border/20 p-8 md:p-12 transition-all">
                <CommentSection
                  blogId={blog.id}
                  currentUserId={currentUserId}
                  initialComments={initialComments}
                />
              </div>
            </div>
          </main>

          {/* Floating TOC for large screens */}
          {headings.length > 0 && (
            <aside className="hidden xl:block fixed top-32 left-[calc(50%+28rem)] w-72">
              <div className="p-6 glass dark:glass-dark rounded-[2rem] border border-border/40 shadow-premium">
                <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <List className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-[0.2em] text-foreground/70">TABLE OF CONTENTS</span>
                </div>
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar scroll-smooth">
                  <TOCContent />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile TOC Button */}
      {headings.length > 0 && (
        <div className="fixed bottom-10 right-6 z-[var(--z-sticky)] lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="h-16 w-16 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-background bg-primary text-primary-foreground transition-all hover:scale-110 active:scale-95">
                <List className="h-7 w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2.5rem] max-h-[85vh] p-0 overflow-hidden border-none shadow-2xl">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2" />
              <SheetHeader className="p-8 border-b border-border/40 bg-muted/10">
                <SheetTitle className="flex items-center justify-between text-2xl font-black">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                      <List className="h-6 w-6 text-primary-foreground" />
                    </div>
                    目次
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">
                    {headings.length} Topics
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-6 h-[60vh] overflow-y-auto no-scrollbar scroll-smooth pb-32">
                <TOCContent isMobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  )
}

export default BlogDetail
