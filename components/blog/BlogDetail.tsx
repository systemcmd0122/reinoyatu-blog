"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  Download,
  Facebook,
  FilePenLine,
  Github,
  Instagram,
  Linkedin,
  Loader2,
  Trash2, 
  Twitter,
  X, 
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Info,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Calendar,
  Globe,
  ArrowRight,
  Wand2
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import Link from "next/link"
import { BlogType, CommentType } from "@/types"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import LikeButton from "@/components/blog/LikeButton"
import BookmarkButton from "@/components/blog/BookmarkButton"
import CommentSection from "@/components/blog/CommentSection"

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
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    ),
  }
)
import { formatJST } from "@/utils/date"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { motion, AnimatePresence } from "framer-motion"

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

interface ImageModalProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  title: string
  authorName: string
}

const CopyrightDialog: React.FC<{
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  authorName: string
}> = ({ isOpen, onConfirm, onCancel, authorName }) => {
  const [personalUseChecked, setPersonalUseChecked] = useState(false)
  const [noCommercialChecked, setNoCommercialChecked] = useState(false)
  const [attributionChecked, setAttributionChecked] = useState(false)

  const canDownload = personalUseChecked && noCommercialChecked && attributionChecked

  const handleConfirm = () => {
    if (canDownload) {
      onConfirm()
      setPersonalUseChecked(false)
      setNoCommercialChecked(false)
      setAttributionChecked(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="relative bg-card rounded-xl shadow-2xl max-w-md w-full mx-4 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">著作権に関する確認</h3>
              <p className="text-sm text-muted-foreground">画像のダウンロード前にご確認ください</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-2">この画像について：</p>
                  <ul className="space-y-1 text-foreground/80 text-sm">
                    <li>• 作成者：{authorName}</li>
                    <li>• この画像には著作権が存在する可能性があります</li>
                    <li>• 適切な利用のため、以下の条件をご確認ください</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <Checkbox
                  id="personal-use"
                  checked={personalUseChecked}
                  onCheckedChange={(checked) => setPersonalUseChecked(!!checked)}
                  className="mt-1"
                />
                <label htmlFor="personal-use" className="text-sm text-foreground cursor-pointer flex-1">
                  <span className="font-medium">個人利用のみ</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    この画像を個人的な用途でのみ使用し、再配布は行いません
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <Checkbox
                  id="no-commercial"
                  checked={noCommercialChecked}
                  onCheckedChange={(checked) => setNoCommercialChecked(!!checked)}
                  className="mt-1"
                />
                <label htmlFor="no-commercial" className="text-sm text-foreground cursor-pointer flex-1">
                  <span className="font-medium">商用利用禁止</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    この画像を商業目的では使用しません
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <Checkbox
                  id="attribution"
                  checked={attributionChecked}
                  onCheckedChange={(checked) => setAttributionChecked(!!checked)}
                  className="mt-1"
                />
                <label htmlFor="attribution" className="text-sm text-foreground cursor-pointer flex-1">
                  <span className="font-medium">著作者の明記</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    使用時には作成者（{authorName}）を適切に明記します
                  </p>
                </label>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            ダウンロードにより上記の条件に同意したものとみなされます
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  imageUrl, 
  isOpen, 
  onClose, 
  title, 
  authorName 
}) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showCopyrightDialog, setShowCopyrightDialog] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blog-image-${title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('画像をダウンロードしました')
      setShowCopyrightDialog(false)
    } catch (error) {
      console.error('画像のダウンロードに失敗しました:', error)
      toast.error('画像のダウンロードに失敗しました')
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25))
  const handleResetZoom = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }
  const handleRotateLeft = () => setRotation(prev => prev - 90)
  const handleRotateRight = () => setRotation(prev => prev + 90)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          if (showCopyrightDialog) {
            setShowCopyrightDialog(false)
          } else {
            onClose()
          }
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case '0':
          e.preventDefault()
          handleResetZoom()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleRotateLeft()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleRotateRight()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showCopyrightDialog, onClose])

  // モーダルが閉じられるときにリセット
  useEffect(() => {
    if (!isOpen) {
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
      setShowCopyrightDialog(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm ${
          isFullscreen ? 'cursor-none' : ''
        }`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 ${
            isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                <h3 className="text-white text-lg font-semibold line-clamp-2 mb-1">
                  {title}
                </h3>
                <p className="text-white/80 text-sm">作成者: {authorName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* 画像表示領域 */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div
              className="relative transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center',
              }}
            >
              <Image
                src={imageUrl}
                alt={title}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain select-none"
                priority
                quality={100}
                draggable={false}
              />
            </div>
          </div>

          {/* コントロールパネル */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
            isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-black/50 rounded-full p-2 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.25}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="縮小 (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className="text-white text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="拡大 (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/30 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateLeft}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="左回転 (←)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateRight}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="右回転 (→)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="リセット (0)"
                >
                  <span className="text-xs font-medium">リセット</span>
                </Button>
                
                <div className="w-px h-6 bg-white/30 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="フルスクリーン (F)"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCopyrightDialog(true)}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                  title="ダウンロード"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* キーボードショートカットヒント */}
            <div className="text-center mt-2">
              <p className="text-white/60 text-xs">
                ショートカット: +/- (ズーム) | ←/→ (回転) | 0 (リセット) | F (フルスクリーン) | Esc (閉じる)
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showCopyrightDialog && (
          <CopyrightDialog
            isOpen={showCopyrightDialog}
            onConfirm={handleDownload}
            onCancel={() => setShowCopyrightDialog(false)}
            authorName={authorName}
          />
        )}
      </AnimatePresence>
    </>
  )
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
  const [showImageModal, setShowImageModal] = useState(false)
  
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

  const isLoading = dataLoadingState.likeLoading || dataLoadingState.bookmarkLoading

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
        toast.error("いいね状態の取得に失敗しました")
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
        toast.error("ブックマーク状態の取得に失敗しました")
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
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-sm">
            {formatJST(blog.updated_at)}
          </Badge>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">読み込み中...</span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">{blog.title}</h1>

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {blog.tags.map(tag => (
              <Link href={`/tags/${tag.name}`} key={tag.name}>
                <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-none shadow-sm cursor-pointer">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {blog.summary && (
        <div className="my-6">
          <Accordion type="single" collapsible className="w-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                <div className="flex items-center space-x-3">
                  <Wand2 className="h-5 w-5 text-purple-500" />
                  <span>AIによる要約</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-base text-foreground/80 leading-relaxed">
                {blog.summary}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <div 
        className="relative aspect-video rounded-lg overflow-hidden shadow-md group cursor-pointer bg-muted/50"
        onClick={() => setShowImageModal(true)}
      >
        <Image
          src={blog.image_url || "/noImage.png"}
          alt="Blog Cover Image"
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white text-sm">クリックで拡大</p>
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground break-words">
        <MarkdownRenderer content={blog.content} />
      </div>

      <div className="flex justify-center md:justify-end space-x-6 pt-4 pb-2">
        {isLoading ? (
          <div className="flex items-center space-x-4 p-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">読み込み中...</span>
          </div>
        ) : (
          <>
            <BookmarkButton 
              blogId={blog.id}
              userId={currentUserId}
              showLabel={true}
              sharedState={sharedBookmarkState}
              onStateChange={setSharedBookmarkState}
              initialIsLoaded={true}
            />
            <LikeButton 
              blogId={blog.id}
              userId={currentUserId}
              initialLikesCount={blog.likes_count || 0}
              showLabel={true}
              sharedState={sharedLikeState}
              onStateChange={setSharedLikeState}
              initialIsLoaded={true}
            />
          </>
        )}
      </div>

      {isMyBlog && (
        <div className="flex justify-end space-x-4 mt-6">
          <Link href={`/blog/${blog.id}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <FilePenLine className="h-4 w-4" />
              <span>編集</span>
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>削除</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card text-card-foreground border shadow-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>本当にブログを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この操作は取り消せません。ブログは完全に削除されます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeletePending}
                  className={buttonVariants({ variant: "destructive" })}
                >
                  {isDeletePending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "削除"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border-t border-border pt-8">
        {/* 著者情報 - シンプルで見やすいプロフィールカード */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <Link 
            href={`/profile/${blog.profiles.id}`}
            className="block group"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                {/* アバター */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-16 h-16 border-2 border-muted">
                    <AvatarImage 
                      src={blog.profiles?.avatar_url || "/noImage.png"} 
                      alt={blog.profiles?.name || "Unknown User"} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-lg font-semibold">
                      {blog.profiles?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* プロフィール情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                      {blog.profiles?.name || "Unknown User"}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      作成者
                    </Badge>
                  </div>
                  
                  {/* 自己紹介 */}
                  {blog.profiles?.introduce && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {blog.profiles.introduce}
                    </p>
                  )}
                  
                  {/* 詳細情報 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {blog.profiles?.created_at && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>参加日: {new Date(blog.profiles.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                    
                    {blog.profiles?.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span className="truncate max-w-32">
                          {blog.profiles.website.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* プロフィールへのリンク */}
                <div className="flex-shrink-0 flex items-center space-x-2 text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                  <span className="text-xs font-medium hidden sm:inline">プロフィール</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              
              {/* ソーシャルリンク */}
              {blog.profiles?.social_links && Object.keys(blog.profiles.social_links).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex flex-wrap gap-2">
                    {blog.profiles.social_links.twitter && (
                      <a 
                        href={blog.profiles.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Twitter className="h-3 w-3" />
                        <span>X(旧Twitter)</span>
                      </a>
                    )}
                    {blog.profiles.social_links.github && (
                      <a 
                        href={blog.profiles.social_links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-muted hover:bg-accent rounded-md text-muted-foreground hover:text-accent-foreground transition-colors duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github className="h-3 w-3" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {blog.profiles.social_links.linkedin && (
                      <a 
                        href={blog.profiles.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Linkedin className="h-3 w-3" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {blog.profiles.social_links.instagram && (
                      <a 
                        href={blog.profiles.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 rounded-md text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Instagram className="h-3 w-3" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {blog.profiles.social_links.facebook && (
                      <a 
                        href={blog.profiles.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Facebook className="h-3 w-3" />
                        <span>Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
      
      <CommentSection
        blogId={blog.id}
        currentUserId={currentUserId}
        initialComments={initialComments}
      />

      <AnimatePresence>
        {showImageModal && (
          <ImageModal
            imageUrl={blog.image_url || "/noImage.png"}
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            title={blog.title}
            authorName={blog.profiles?.name || "Unknown User"}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlogDetail