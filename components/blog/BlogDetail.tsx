"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  Clock,
  Facebook,
  FilePenLine,
  List,
  Github,
  Instagram,
  Linkedin,
  Loader2,
  Trash2, 
  Twitter,
  X, 
  ZoomIn,
  Calendar,
  Globe,
  ArrowRight,
  Wand2,
  Heart,
  Bookmark
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import Link from "next/link"
import { BlogType, CommentType } from "@/types"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import LikeButton from "@/components/blog/LikeButton"
import BookmarkButton from "@/components/blog/BookmarkButton"
import CommentSection from "@/components/blog/CommentSection"
import { formatJST } from "@/utils/date"
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
import { getBlogLikeStatus } from "@/actions/like"
import { getBlogBookmarkStatus } from "@/actions/bookmark"
import { AnimatePresence } from "framer-motion"

const MarkdownRenderer = dynamic(
  () => import("@/components/blog/markdown/MarkdownRenderer"),
  {
    ssr: false,
    loading: () => (
      <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground break-words space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  }
)

interface BlogDetailProps {
  blog: BlogType & {
    profiles: {
      id: string
      name: string
      avatar_url: string | null
      introduce: string | null
      email?: string
      website?: string
      created_at?: string
      social_links?: {
        twitter?: string
        github?: string
        linkedin?: string
        instagram?: string
        facebook?: string
      }
    }
    likes_count: number
  }
  isMyBlog: boolean
  currentUserId?: string
  initialComments?: CommentType[]
}

const BlogDetail: React.FC<BlogDetailProps> = ({ 
  blog, 
  isMyBlog, 
  currentUserId, 
  initialComments 
}) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>("")

  // 読了時間の計算 (1分間に500文字程度)
  const readingTime = Math.ceil((blog.content?.length || 0) / 500)

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
    const rawHeadings = blog.content.match(/^#{1,3}\s+.+$/gm) || []
    const parsedHeadings = rawHeadings.map(heading => {
      const level = heading.match(/^#+/)?.[0].length || 0
      const text = heading.replace(/^#+\s+/, "")
      const id = text.replace(/\s+/g, "-").toLowerCase()
      return { id, text, level }
    })
    setHeadings(parsedHeadings)
  }, [blog.content])

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
    likesCount: blog.likes_count || 0,
  })
  
  const [sharedBookmarkState, setSharedBookmarkState] = useState<{
    isBookmarked: boolean
  }>({
    isBookmarked: false,
  })

  const [dataLoadingState, setDataLoadingState] = useState({
    likeLoading: !!currentUserId,
    bookmarkLoading: !!currentUserId,
  })

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUserId) {
        setDataLoadingState({
          likeLoading: false,
          bookmarkLoading: false,
        })
        return
      }

      try {
        const { isLiked } = await getBlogLikeStatus({ 
          blogId: blog.id, 
          userId: currentUserId 
        })
        setSharedLikeState({
          isLiked,
          likesCount: blog.likes_count || 0,
        })
      } catch (error) {
        console.error("いいね状態の取得に失敗しました", error)
      } finally {
        setDataLoadingState(prev => ({
          ...prev,
          likeLoading: false,
        }))
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
      } finally {
        setDataLoadingState(prev => ({
          ...prev,
          bookmarkLoading: false,
        }))
      }
    }

    fetchInitialData()
  }, [blog.id, currentUserId, blog.likes_count])

  const handleDelete = () => {
    setIsDeletePending(true)
    setError("")

    startTransition(async () => {
      try {
        const res = await deleteBlog({
          blogId: blog.id,
          imageUrl: blog.image_url,
          userId: blog.user_id,
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
    <div className="min-h-screen bg-[#f5f6f6] dark:bg-background pb-20">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-transparent">
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
                {/* Header Info */}
                <div className="flex items-center gap-3 mb-8">
                  <Link href={`/profile/${blog.profiles.id}`}>
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={blog.profiles?.avatar_url || "/default.png"} />
                      <AvatarFallback>{blog.profiles?.name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex flex-col">
                    <Link href={`/profile/${blog.profiles.id}`} className="text-sm font-bold hover:underline">
                      @{blog.profiles.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatJST(blog.created_at)}に投稿</span>
                      {blog.created_at !== blog.updated_at && <span>(更新: {formatJST(blog.updated_at)})</span>}
                      <span className="mx-1">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readingTime}分で読めます
                      </span>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <BookmarkButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      showLabel={false}
                      sharedState={sharedBookmarkState}
                      onStateChange={setSharedBookmarkState}
                      initialIsLoaded={true}
                    />
                    <LikeButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      initialLikesCount={blog.likes_count || 0}
                      showLabel={false}
                      sharedState={sharedLikeState}
                      onStateChange={setSharedLikeState}
                      initialIsLoaded={true}
                    />
                  </div>
                </div>

                {/* Title and Tags */}
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 text-foreground leading-tight">
                  {blog.title}
                </h1>

                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {blog.tags.map(tag => (
                      <Link href={`/tags/${tag.name}`} key={tag.name}>
                        <Badge variant="secondary" className="px-3 py-1 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-none shadow-none cursor-pointer font-medium">
                          #{tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {blog.summary && (
                  <div className="mb-10 p-6 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[hsl(var(--primary))]" />
                    <div className="flex items-center gap-2 mb-3 text-[hsl(var(--primary))]">
                      <Wand2 className="h-5 w-5" />
                      <span className="font-bold">AIによる要約</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed text-sm">
                      {blog.summary}
                    </p>
                  </div>
                )}

                {/* Cover Image */}
                {blog.image_url && (
                  <div className="mb-10 relative aspect-video rounded-xl overflow-hidden border border-border">
                    <Image
                      src={blog.image_url}
                      alt="Cover"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground break-words prose-headings:font-black prose-a:text-[hsl(var(--primary))] prose-pre:bg-[#2d2d2d]">
                  <MarkdownRenderer content={blog.content} />
                </div>

                {/* Article Footer */}
                <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <LikeButton 
                      blogId={blog.id}
                      userId={currentUserId}
                      initialLikesCount={blog.likes_count || 0}
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
          <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-6">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="hidden lg:block sticky top-20 bg-card rounded-2xl border border-border shadow-sm overflow-hidden max-h-[calc(100vh-120px)] flex flex-col">
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
                    <AvatarImage src={blog.profiles?.avatar_url || "/default.png"} className="object-cover" />
                    <AvatarFallback>{blog.profiles?.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-xl font-bold mb-1">
                  <Link href={`/profile/${blog.profiles.id}`} className="hover:underline">
                    {blog.profiles.name}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  @{blog.profiles.name}
                </p>
                {blog.profiles.introduce && (
                  <p className="text-sm text-foreground/80 line-clamp-3 mb-6">
                    {blog.profiles.introduce}
                  </p>
                )}
                
                <Button variant="outline" className="w-full rounded-md font-bold" asChild>
                  <Link href={`/profile/${blog.profiles.id}`}>
                    プロフィールを見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                {/* Social Links */}
                    {(blog.profiles.website || (blog.profiles.social_links && Object.keys(blog.profiles.social_links).length > 0)) && (
                  <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-border">
                        {blog.profiles.social_links?.twitter && (
                      <a href={blog.profiles.social_links.twitter} target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                        {blog.profiles.social_links?.github && (
                      <a href={blog.profiles.social_links.github} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Github className="h-5 w-5" />
                      </a>
                    )}
                        {blog.profiles.website && (
                          <a href={blog.profiles.website} target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
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
