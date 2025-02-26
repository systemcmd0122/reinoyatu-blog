"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { FilePenLine, Loader2, Trash2 } from "lucide-react"
import { deleteBlog } from "@/actions/blog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { BlogType } from "@/types"
import MarkdownRenderer from "@/components/blog/markdown/MarkdownRenderer"
import LikeButton from "@/components/blog/LikeButton"
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
  blog: BlogType & {
    profiles: {
      name: string
      avatar_url: string | null
      introduce: string | null
    }
    likes_count: number
  }
  isMyBlog: boolean
  currentUserId?: string
}

const BlogDetail: React.FC<BlogDetailProps> = ({ blog, isMyBlog, currentUserId }) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()
  const [isDeletePending, setIsDeletePending] = useState(false)

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
    <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
      <div className="md:col-span-2 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-sm">
              {format(new Date(blog.updated_at), "yyyy/MM/dd HH:mm")}
            </Badge>
            
            <LikeButton 
              blogId={blog.id}
              userId={currentUserId}
              initialLikesCount={blog.likes_count || 0}
            />
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

        {isMyBlog && (
          <div className="flex justify-end space-x-4">
            <Link href={`/blog/${blog.id}/edit`}>
              <Button variant="outline" size="icon">
                <FilePenLine className="h-5 w-5" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="icon"
                >
                  <Trash2 className="h-5 w-5" />
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
      </div>

      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage 
                src={blog.profiles.avatar_url || "/noImage.png"} 
                alt="Author Avatar" 
              />
              <AvatarFallback>
                {blog.profiles.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{blog.profiles.name}</h2>
              {blog.profiles.introduce && (
                <p className="text-sm text-muted-foreground">
                  {blog.profiles.introduce}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BlogDetail