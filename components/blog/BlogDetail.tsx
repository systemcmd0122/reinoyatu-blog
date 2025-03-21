"use client"

import React, { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  FilePenLine, 
  Loader2, 
  Trash2, 
  X, 
  Mail, 
  Globe, 
  Calendar,
  ZoomIn,
  Download,
  Twitter,
  Github,
  Linkedin
} from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
      name: string
      avatar_url: string | null
      introduce: string | null
      email?: string
      website?: string
      created_at: string
      social_links?: {
        twitter?: string
        github?: string
        linkedin?: string
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
  title: string // タイトルを追加
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
  const [showProfileModal, setShowProfileModal] = useState(false)
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

  const formatIntroduce = (text: string | null) => {
    if (!text) return null
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  return (
    <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      <div className="md:col-span-2 space-y-6">
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
        
        <CommentSection
          blogId={blog.id}
          currentUserId={currentUserId}
          initialComments={initialComments}
        />
      </div>

      <div className="md:col-span-1 space-y-6">
        <Card className="sticky top-20 backdrop-blur-sm bg-card/95 shadow-xl border-primary/10">
          <CardContent className="p-6">
            <div className="relative">
              <div className="absolute -top-6 -left-6 -right-6 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg" />
              
              <div className="relative">
                <motion.div 
                  className="relative z-10 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-28 h-28 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full opacity-20 animate-pulse" />
                    <Avatar 
                      className="w-28 h-28 border-4 border-background shadow-xl cursor-pointer"
                      onClick={() => setShowProfileModal(true)}
                    >
                      <AvatarImage 
                        src={blog.profiles.avatar_url || "/noImage.png"} 
                        alt={`${blog.profiles.name}'s avatar`}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl">
                        {blog.profiles.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </motion.div>

                <div className="text-center mt-4 space-y-3">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {blog.profiles.name}
                  </h2>
                  
                  <div className="space-y-2">
                    {blog.profiles.introduce && (
                      <div className="text-sm text-muted-foreground leading-relaxed px-4">
                        {formatIntroduce(blog.profiles.introduce)}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border/50 mt-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {blog.profiles.email && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${blog.profiles.email}`}>
                            {blog.profiles.email}
                          </a>
                        </div>
                      )}
                      {blog.profiles.website && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={blog.profiles.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {new URL(blog.profiles.website).hostname}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatJST(blog.profiles.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {blog.profiles.social_links && (
                    <div className="flex justify-center space-x-4 mt-4">
                      {blog.profiles.social_links.twitter && (
                        <a
                          href={blog.profiles.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {blog.profiles.social_links.github && (
                        <a
                          href={blog.profiles.social_links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                      {blog.profiles.social_links.linkedin && (
                        <a
                          href={blog.profiles.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-lg mx-4"
              onClick={e => e.stopPropagation()}
            >
              <Card className="relative overflow-hidden bg-card/95 backdrop-blur-sm shadow-xl">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10"
                  onClick={() => setShowProfileModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <CardContent className="p-8">
                  <div className="relative">
                    <div className="absolute -top-8 -left-8 -right-8 h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg" />
                    
                    <div className="relative text-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="w-36 h-36 mx-auto border-4 border-background shadow-xl">
                          <AvatarImage 
                            src={blog.profiles.avatar_url || "/noImage.png"} 
                            alt={`${blog.profiles.name}'s avatar`}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-4xl">
                            {blog.profiles.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>

                      <div className="mt-6 space-y-4">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {blog.profiles.name}
                        </h2>
                        
                        {blog.profiles.introduce && (
                          <div className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                            {formatIntroduce(blog.profiles.introduce)}
                          </div>
                        )}

                        <div className="pt-6 border-t border-border/50 mt-6">
                          <div className="grid grid-cols-1 gap-3">
                            {blog.profiles.email && (
                              <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${blog.profiles.email}`}>
                                  {blog.profiles.email}
                                </a>
                              </div>
                            )}
                            {blog.profiles.website && (
                              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Globe className="w-4 h-4" />
                                <a 
                                  href={blog.profiles.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary transition-colors"
                                >
                                  {blog.profiles.website}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {formatJST(blog.profiles.created_at)}</span>
                            </div>
                          </div>

                          {blog.profiles.social_links && (
                            <div className="flex justify-center space-x-6 mt-6">
                              {blog.profiles.social_links.twitter && (
                                <a
                                  href={blog.profiles.social_links.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Twitter className="w-6 h-6" />
                                </a>
                              )}
                              {blog.profiles.social_links.github && (
                                <a
                                  href={blog.profiles.social_links.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Github className="w-6 h-6" />
                                </a>
                              )}
                              {blog.profiles.social_links.linkedin && (
                                <a
                                  href={blog.profiles.social_links.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Linkedin className="w-6 h-6" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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