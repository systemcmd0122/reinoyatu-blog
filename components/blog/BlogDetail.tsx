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
  Calendar} from "lucide-react"
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
  
  // 共有状態: いいねとブックマークの状態を一元管理
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

  // 各種データの読み込み状態を管理
  const [dataLoadingState, setDataLoadingState] = useState({
    likeLoading: !!currentUserId,
    bookmarkLoading: !!currentUserId,
  })

  // 全体のローディング状態
  const isLoading = dataLoadingState.likeLoading || dataLoadingState.bookmarkLoading

  // プロフィールの改行を処理する関数
  const formatIntroduce = (text: string | null) => {
    if (!text) return null
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  // プロフィールカード用のアニメーション設定
  const profileCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  // 初期データの取得
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUserId) {
        setDataLoadingState({
          likeLoading: false,
          bookmarkLoading: false,
        })
        return
      }

      // いいね状態の取得
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

      // ブックマーク状態の取得
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

  // ブログ削除処理
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

  // プロフィールカードコンポーネント
  const ProfileCard = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={profileCardVariants}
    >
      <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-primary/10">
        <CardContent className="p-6">
          <div className="relative">
            {/* プロフィール背景のアクセント */}
            <div className="absolute -top-6 -left-6 -right-6 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg" />
            
            <div className="relative">
              {/* アバター画像 */}
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

              {/* プロフィール情報 */}
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

                {/* プロフィール詳細情報 */}
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

                {/* ソーシャルリンク */}
                {blog.profiles.social_links && (
                  <div className="flex justify-center space-x-4 mt-4">
                    {blog.profiles.social_links.twitter && (
                      <a
                        href={blog.profiles.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                    {blog.profiles.social_links.github && (
                      <a
                        href={blog.profiles.social_links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                      </a>
                    )}
                    {blog.profiles.social_links.linkedin && (
                      <a
                        href={blog.profiles.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // プロフィールモーダル
  const ProfileModal = () => (
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
                  {/* モーダル背景のアクセント */}
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

                        {/* ソーシャルリンク - モーダル内 */}
                        {blog.profiles.social_links && (
                          <div className="flex justify-center space-x-6 mt-6">
                            {blog.profiles.social_links.twitter && (
                              <a
                                href={blog.profiles.social_links.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                              </a>
                            )}
                            {blog.profiles.social_links.github && (
                              <a
                                href={blog.profiles.social_links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                                </svg>
                              </a>
                            )}
                            {blog.profiles.social_links.linkedin && (
                              <a
                                href={blog.profiles.social_links.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
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
  )

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

        <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
          <Image
            src={blog.image_url || "/noImage.png"}
            alt="Blog Cover Image"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="prose max-w-none text-foreground break-words">
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
                <Button variant="outline" size="sm" className="flex items-center space-x-2 px-4 py-2">
                  <FilePenLine className="h-4 w-4" />
                  <span>編集</span>
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex items-center space-x-2 px-4 py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>削除</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
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
  
        <div className="md:col-span-1">
          <ProfileCard />
        </div>
  
        <ProfileModal />
      </div>
    )
  }
  
  export default BlogDetail