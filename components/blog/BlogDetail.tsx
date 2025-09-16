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
  ZoomIn
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { BlogType, CommentType } from "@/types"
import MarkdownRenderer from "@/components/blog/markdown/MarkdownRenderer"
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
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose, title }) => {
  if (!isOpen) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blog-image-${Date.now()}.${blob.type.split('/')[1]}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('画像をダウンロードしました')
    } catch (error) {
      console.error('画像のダウンロードに失敗しました:', error)
      toast.error('画像のダウンロードに失敗しました')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="relative max-w-7xl w-full h-[90vh] flex flex-col items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt="Full size image"
            fill
            className="object-contain"
            priority
            quality={100}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleDownload}
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mx-auto max-w-2xl bg-background/80 backdrop-blur-sm p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          </div>
        </div>
      </motion.div>
    </motion.div>
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

  // formatIntroduce was removed because it's not used in this component

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
      </div>

      <div 
        className="relative aspect-video rounded-lg overflow-hidden shadow-md group cursor-pointer"
        onClick={() => setShowImageModal(true)}
      >
        <Image
          src={blog.image_url || "/noImage.png"}
          alt="Blog Cover Image"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white" />
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
            <AlertDialogContent className="bg-white dark:bg-slate-900 border shadow-lg">
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      <div className="border-t border-border pt-6">
        <Link href={`/profile/${blog.profiles.id}`} className="inline-block w-full">
          <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent transition-colors">
            <Avatar className="w-16 h-16">
              <AvatarImage 
                src={blog.profiles.avatar_url || "/noImage.png"} 
                alt={blog.profiles.name} 
                className="object-cover"
              />
              <AvatarFallback>{blog.profiles.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{blog.profiles.name}</h3>
              {blog.profiles.introduce && (
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {blog.profiles.introduce}
                </p>
              )}
              {blog.profiles.social_links && Object.keys(blog.profiles.social_links).length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {blog.profiles.social_links.twitter && (
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                  )}
                  {blog.profiles.social_links.github && (
                    <Github className="h-4 w-4 text-muted-foreground" />
                  )}
                  {blog.profiles.social_links.linkedin && (
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                  )}
                  {blog.profiles.social_links.instagram && (
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                  )}
                  {blog.profiles.social_links.facebook && (
                    <Facebook className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
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
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlogDetail