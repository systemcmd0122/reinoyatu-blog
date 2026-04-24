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
              "block py-2 text-sm transition-all hover:text-primary leading-tight font-bold rounded-md px-3",
              heading.level === 1 ? "text-foreground" :
              heading.level === 2 ? "ml-4 text-muted-foreground font-medium text-xs" :
              "ml-8 text-muted-foreground text-[11px] font-medium",
              activeId === heading.id ? "text-primary bg-primary/5" : "hover:bg-muted/50"
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
      <div className="max-w-screen-xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm uppercase tracking-wider mb-8 group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          フィードに戻る
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article>
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
                <div className="rounded-lg overflow-hidden shadow-sm border border-border/40">
                  <CoverImage url={blogData.cover_image_url} title={blogData.title} />
                </div>

                {/* 5. ArticleContent */}
                <div className="bg-card rounded-lg border border-border/40 p-8 md:p-12 shadow-sm relative overflow-hidden">
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
              <div className="mt-12 pt-8 border-t flex flex-col md:flex-row gap-6 justify-between items-center p-6">
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

            {/* Comments Section */}
            <div className="mt-12 bg-card rounded-lg border border-border/40 p-8 md:p-12 shadow-sm">
              <div className="mb-8 flex items-center gap-4">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold">コメント</h2>
              </div>
              <CommentSection
                blogId={blog.id}
                currentUserId={currentUserId}
                initialComments={initialComments}
              />
            </div>
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-8">
            {/* Series Sidebar */}
            {collection && (
              <div>
                <SeriesSidebar collection={collection} currentBlogId={blog.id} />
              </div>
            )}

            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="hidden lg:block sticky top-24 z-[var(--z-sticky)] bg-card rounded-lg border border-border/40 shadow-sm overflow-hidden max-h-[calc(100vh-140px)] flex flex-col">
                <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <List className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-xs uppercase tracking-wider">目次</h2>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <TOCContent />
                </ScrollArea>
              </div>
            )}

            {/* Author Profile Card */}
            <div className="bg-card rounded-lg border border-border/40 shadow-sm overflow-hidden">
              <div className="h-24 bg-muted/30" />
              <div className="px-6 pb-8">
                <div className="relative -mt-12 mb-4">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-sm">
                    <AvatarImage src={blogData.author.avatar_url || "/default.png"} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold">{blogData.author.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-xl font-bold mb-1">
                  <Link href={`/profile/${blogData.author.id}`} className="hover:text-primary transition-colors">
                    {blogData.author.name}
                  </Link>
                </h3>
                <p className="text-xs font-medium text-muted-foreground mb-4">
                  @{blogData.author.name}
                </p>
                {blogData.author.introduce && (
                  <p className="text-sm text-foreground/70 line-clamp-3 mb-6 leading-relaxed">
                    {blogData.author.introduce}
                  </p>
                )}
                
                <Button size="lg" className="w-full rounded-md font-bold group" asChild>
                  <Link href={`/profile/${blogData.author.id}`}>
                    プロフィールを見る
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              <Button size="icon" className="h-14 w-14 rounded-full shadow-lg border-2 border-background bg-primary text-primary-foreground transition-all">
                <List className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl max-h-[80vh] p-0 overflow-hidden">
              <SheetHeader className="p-6 border-b border-border/40 bg-muted/20">
                <SheetTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-1.5 bg-primary rounded-md">
                    <List className="h-5 w-5 text-primary-foreground" />
                  </div>
                  目次
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="p-4 h-full overflow-y-auto pb-20">
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
