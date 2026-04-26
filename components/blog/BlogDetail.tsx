"use client"

import React, { useEffect, useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  FilePenLine,
  List,
  Trash2,
  Download,
  ArrowRight,
  Twitter,
  Globe,
  Share2,
  Heart,
  ChevronLeft,
  BookOpen,
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { getBlogLikeStatus } from "@/actions/like"
import { getBlogBookmarkStatus } from "@/actions/bookmark"
import { incrementViewCount, getRelatedBlogs } from "@/actions/blog"
import { calculateReadingTime } from "@/utils/blog-helpers"
import { useRealtime } from "@/hooks/use-realtime"
import { shareContent } from "@/utils/share"
import { motion } from "framer-motion"
import Image from "next/image"

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
  collection,
}) => {
  const [blogData, setBlogData] = useState<NormalizedArticle>(blog)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([])
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const tocRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})

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

  // ── スクロール進捗 ──────────────────────────
  useEffect(() => {
    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return setScrollProgress(0)
      setScrollProgress(Math.min(Math.max((window.scrollY / scrollHeight) * 100, 0), 100))
    }
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  // ── リアルタイム購読 ───────────────────────
  const lastEvent = useRealtime<any>("blogs", {
    event: "*",
    filter: `id=eq.${blog.id}`,
  })

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.eventType === "UPDATE") {
      const u = lastEvent.new as any
      setBlogData(prev => ({
        ...prev,
        title: u.title || prev.title,
        content: u.content || prev.content,
        cover_image_url: u.image_url !== undefined ? u.image_url : prev.cover_image_url,
        ai_summary: u.summary !== undefined ? u.summary : prev.ai_summary,
        updated_at: u.updated_at || prev.updated_at,
        view_count: u.view_count !== undefined ? u.view_count : prev.view_count,
        reading_time: calculateReadingTime(u.content || prev.content),
      }))
    } else if (lastEvent.eventType === "DELETE") {
      toast.error("この記事は削除されました")
      router.push("/")
    }
  }, [lastEvent, router])

  // ── 見出し抽出（日本語対応） ───────────────
  useEffect(() => {
    const rawHeadings = blogData.content.match(/^#{1,3}\s+.+$/gm) || []
    const parsed = rawHeadings.map(h => {
      const level = h.match(/^#+/)?.[0].length || 0
      const text = h.replace(/^#+\s+/, "")
      // 日本語を含む見出しIDも保持
      const id = text
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u3040-\u9fff\u30a0-\u30ff\-]/g, "")
        .toLowerCase()
      return { id, text, level }
    })
    setHeadings(parsed)
  }, [blogData.content])

  // ── 目次ハイライト（IntersectionObserver） ─
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    )
    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  // ── アクティブTOCをスクロール表示 ──────────
  useEffect(() => {
    tocRefs.current[activeId]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [activeId])

  // ── 閲覧数カウント ─────────────────────────
  useEffect(() => {
    const t = setTimeout(() => incrementViewCount(blog.id), 2000)
    return () => clearTimeout(t)
  }, [blog.id])

  // ── いいね・ブックマーク初期取得 ──────────
  useEffect(() => {
    if (!currentUserId) return
    const fetch = async () => {
      try {
        const { isLiked } = await getBlogLikeStatus({ blogId: blog.id, userId: currentUserId })
        setSharedLikeState(prev => ({ ...prev, isLiked }))
      } catch {}
      try {
        const { isBookmarked } = await getBlogBookmarkStatus({ blogId: blog.id, userId: currentUserId })
        setSharedBookmarkState({ isBookmarked })
      } catch {}
    }
    fetch()
  }, [blog.id, currentUserId])

  // ── 関連記事取得 ───────────────────────────
  useEffect(() => {
    if (!blog.tags?.length) return
    getRelatedBlogs(blog.id, blog.tags).then(({ blogs }) => setRelatedBlogs(blogs || []))
  }, [blog.id, blog.tags])

  // ── ハンドラ ───────────────────────────────
  const handleDelete = () => {
    setIsDeletePending(true)
    startTransition(async () => {
      try {
        const res = await deleteBlog({
          blogId: blog.id,
          imageUrl: blogData.cover_image_url,
          userId: blogData.user_id,
        })
        if (res?.error) { toast.error(res.error); setIsDeletePending(false); return }
        toast.success("ブログを削除しました")
        router.push("/")
        router.refresh()
      } catch {
        toast.error("エラーが発生しました")
        setIsDeletePending(false)
      }
    })
  }

  const handleExportMarkdown = () => {
    const blob = new Blob([`# ${blogData.title}\n\n${blogData.content}`], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement("a"), { href: url, download: `${blogData.title}.md` })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Markdownをエクスポートしました")
  }

  // ── TOC コンテンツ ─────────────────────────
  const TOCContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className="space-y-0.5">
      {headings.map(heading => {
        const isActive = activeId === heading.id
        const item = (
          <a
            key={heading.id}
            ref={el => { tocRefs.current[heading.id] = el }}
            href={`#${heading.id}`}
            className={cn(
              "group relative flex items-start gap-2 py-1.5 pr-3 text-[13px] leading-snug rounded-md transition-all duration-150",
              heading.level === 1
                ? "pl-3 font-semibold"
                : heading.level === 2
                ? "pl-6 font-medium"
                : "pl-9 font-normal",
              isActive
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={e => {
              e.preventDefault()
              const el = document.getElementById(heading.id)
              if (el) {
                window.scrollTo({
                  top: el.getBoundingClientRect().top + window.scrollY - 96,
                  behavior: "smooth",
                })
              }
            }}
          >
            {isActive && (
              <motion.div
                layoutId={isMobile ? "toc-active-m" : "toc-active"}
                className="absolute left-1 top-1.5 bottom-1.5 w-0.5 bg-foreground rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="truncate">{heading.text}</span>
          </a>
        )
        return isMobile
          ? <SheetClose asChild key={heading.id}>{item}</SheetClose>
          : <React.Fragment key={heading.id}>{item}</React.Fragment>
      })}
    </nav>
  )

  // ────────────────────────────────────────────
  //  レンダリング
  //
  //  レイアウト構造：
  //  ┌─────────────────────────────────────────┐
  //  │  max-w-screen-xl  (1280px)  mx-auto     │
  //  │  ┌──────────────────┐  ┌─────────────┐ │
  //  │  │  記事 (max-w-2xl)│  │  TOC (w-60) │ │
  //  │  └──────────────────┘  └─────────────┘ │
  //  └─────────────────────────────────────────┘
  //
  //  TOCは position:sticky で記事と同じフロー内に配置。
  //  fixedは使わない → 記事に被る問題を解消。
  // ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── 読み進めプログレスバー ── */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[var(--z-progress)] bg-border/30"
        aria-hidden="true"
      >
        <div
          className="h-full bg-foreground/80 transition-[width] duration-100 ease-linear"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── ページ全体のコンテナ ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-32">

        {/* 戻るリンク */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          フィードに戻る
        </Link>

        {/*
          ── 2カラムレイアウト ──────────────────────────
          記事本文 (flex-1, min-w-0) + TOCサイドバー (w-56 xl:w-64)
          TOCは xl 以上でのみ表示。sticky で追従。
          gap-16 で十分な余白を確保。
        */}
        <div className="flex items-start gap-12 xl:gap-16">

          {/* ── メイン記事エリア ── */}
          <main className="flex-1 min-w-0 max-w-[720px]">
            <article>

              {/* カバー画像 */}
              {blogData.cover_image_url && (
                <div className="rounded-xl overflow-hidden border border-border/30 mb-10 aspect-[16/9] relative">
                  <CoverImage url={blogData.cover_image_url} title={blogData.title} />
                </div>
              )}

              {/* 記事ヘッダー（タイトル・著者・メタ情報） */}
              <ArticleHeader
                author={blogData.author}
                authors={blogData.authors}
                createdAt={blogData.created_at}
                updatedAt={blogData.updated_at}
                readingTime={blogData.reading_time}
                viewCount={blogData.view_count}
                title={blogData.title}
              />

              {/* タグ */}
              <div className="mb-8">
                <TagSection tags={blogData.tags} />
              </div>

              {/* AI要約 */}
              {blogData.ai_summary && (
                <div className="mb-10">
                  <SummarySection summary={blogData.ai_summary} />
                </div>
              )}

              {/* 記事本文 */}
              <div className="pb-16">
                <ArticleContent content={blogData.content} />
              </div>

            </article>

            {/* ── 著者プロフィールカード ── */}
            <div className="border-t border-border/50 pt-10 mb-12">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Link href={`/profile/${blogData.author.id}`} className="flex-shrink-0">
                  <Avatar className="h-14 w-14 border border-border/40">
                    <AvatarImage src={blogData.author.avatar_url || "/default.png"} className="object-cover" />
                    <AvatarFallback className="text-lg font-semibold">{blogData.author.name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link href={`/profile/${blogData.author.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                      {blogData.author.name}
                    </Link>
                    <div className="flex items-center gap-1">
                      {blogData.author.homepage_url && (
                        <a href={blogData.author.homepage_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {blogData.author.social_links?.twitter && (
                        <a href={blogData.author.social_links.twitter} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                          <Twitter className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {blogData.author.introduce && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                      {blogData.author.introduce}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="rounded-lg text-sm h-8 px-4" asChild>
                    <Link href={`/profile/${blogData.author.id}`}>
                      プロフィールを見る
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* ── シリーズナビゲーション ── */}
            {collection && (
              <div className="mb-12">
                <SeriesNavigation
                  collection={collection}
                  currentIndex={collection.collection_items.findIndex(i => i.blog_id === blog.id)}
                  totalCount={collection.collection_items.length}
                  prevPost={(() => {
                    const idx = collection.collection_items.findIndex(i => i.blog_id === blog.id)
                    return idx > 0 ? (collection.collection_items[idx - 1].blogs as any) : null
                  })()}
                  nextPost={(() => {
                    const idx = collection.collection_items.findIndex(i => i.blog_id === blog.id)
                    return idx < collection.collection_items.length - 1
                      ? (collection.collection_items[idx + 1].blogs as any)
                      : null
                  })()}
                />
              </div>
            )}

            {/* ── フッターアクション（いいね・ブックマーク・共有・編集） ── */}
            <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              {/* 左：インタラクション */}
              <div className="flex items-center gap-2">
                <div className="border border-border/40 rounded-lg overflow-hidden">
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
                <div className="border border-border/40 rounded-lg overflow-hidden">
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
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground h-9 px-3 rounded-lg"
                  onClick={() => shareContent({ title: blogData.title, url: window.location.href })}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm">共有</span>
                </Button>
              </div>

              {/* 右：オーナー操作 */}
              {isMyBlog && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground"
                    onClick={handleExportMarkdown}>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">MD出力</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 px-4 rounded-lg text-sm" asChild>
                    <Link href={`/blog/${blog.id}/edit`}>
                      <FilePenLine className="h-4 w-4" />
                      編集
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm"
                        className="gap-1.5 h-9 px-3 rounded-lg text-sm text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">削除</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold">記事を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          この操作は取り消せません。記事を削除してもよろしいですか？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-lg">キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeletePending}
                          className={cn(buttonVariants({ variant: "destructive" }), "rounded-lg")}
                        >
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* ── 関連記事 ── */}
            {relatedBlogs.length > 0 && (
              <div className="mt-16">
                <h2 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-1 h-4 bg-foreground/70 rounded-full inline-block" />
                  関連記事
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {relatedBlogs.map(related => (
                    <Link key={related.id} href={`/blog/${related.id}`}
                      className="group flex flex-col rounded-xl border border-border/40 overflow-hidden hover:border-border transition-all hover:shadow-sm">
                      {related.image_url ? (
                        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                          <Image src={related.image_url} alt={related.title} fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" unoptimized />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground font-medium px-4 text-center line-clamp-2">{related.title}</span>
                        </div>
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-sm font-semibold line-clamp-2 mb-3 group-hover:text-primary transition-colors leading-snug">
                          {related.title}
                        </h3>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={related.profiles?.avatar_url || "/default.png"} />
                              <AvatarFallback className="text-[9px]">{related.profiles?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{related.profiles?.name}</span>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            {related.likes_count}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── コメント ── */}
            <div className="mt-16">
              <h2 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="w-1 h-4 bg-foreground/70 rounded-full inline-block" />
                コメント
              </h2>
              <CommentSection
                blogId={blog.id}
                currentUserId={currentUserId}
                initialComments={initialComments}
              />
            </div>
          </main>

          {/* ── TOCサイドバー（デスクトップのみ）──
              sticky で上部に追従。
              xl以上 (1280px+) で表示。
              w-56: 224px, xl:w-64: 256px
              flex-shrink-0 で幅を固定。
              記事エリアとはgap-12/16で自然な余白。
          */}
          {headings.length > 0 && (
            <aside className="hidden xl:block w-56 flex-shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar">
                {/* TOCヘッダー */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    目次
                  </span>
                </div>
                {/* TOCリスト */}
                <TOCContent />
              </div>
            </aside>
          )}

        </div>
      </div>

      {/* ── モバイル目次ボタン（xl未満） ── */}
      {headings.length > 0 && (
        <div className="fixed bottom-6 right-4 z-[var(--z-sticky)] xl:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-foreground text-background hover:bg-foreground/90 border-0"
                aria-label="目次を開く"
              >
                <List className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] p-0 overflow-hidden border-t border-border/50">
              {/* ドラッグハンドル */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-0" />
              <SheetHeader className="px-6 py-4 border-b border-border/40">
                <SheetTitle className="flex items-center justify-between text-base font-bold">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    目次
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">
                    {headings.length} 項目
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 overflow-y-auto max-h-[60vh] no-scrollbar pb-8">
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