"use client"

import React, { useState, useTransition } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ImagePlus, Trash2 } from "lucide-react"
import { BlogSchema } from "@/schemas"
import { editBlog, deleteBlog } from "@/actions/blog"
import { useRouter } from "next/navigation"
import { BlogType } from "@/types"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import MarkdownHelp from "@/components/blog/markdown/MarkdownHelp"

interface BlogEditProps {
  blog: BlogType
}

const BlogEdit: React.FC<BlogEditProps> = ({ blog }) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false) 
  const [, startTransition] = useTransition()
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(
    blog.image_url || "/noImage.png"
  )

  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: blog.title,
      content: blog.content,
    },
  })

  const onSubmit = async (values: z.infer<typeof BlogSchema>) => {
    if (isPending) return; // 処理中の場合は早期リターン
    
    setError("")
    setIsPending(true)

    try {
      // 画像ファイルがある場合
      if (imageFile) {
        // Promise を使って FileReader を同期的に扱う
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })

        startTransition(async () => {
          try {
            const res = await editBlog({
              ...values,
              blogId: blog.id,
              imageUrl: blog.image_url,
              base64Image,
              userId: blog.user_id,
            })

            if (res?.error) {
              setError(res.error)
              setIsPending(false)
              return
            }

            toast.success("ブログを編集しました")
            router.push(`/blog/${blog.id}`)
            router.refresh()
          } catch (error) {
            console.error(error)
            setError("エラーが発生しました")
            setIsPending(false)
          }
        })
      } else {
        // 画像ファイルがない場合
        startTransition(async () => {
          try {
            const res = await editBlog({
              ...values,
              blogId: blog.id,
              imageUrl: blog.image_url,
              base64Image: undefined,
              userId: blog.user_id,
            })

            if (res?.error) {
              setError(res.error)
              setIsPending(false)
              return
            }

            toast.success("ブログを編集しました")
            router.push(`/blog/${blog.id}`)
            router.refresh()
          } catch (error) {
            console.error(error)
            setError("エラーが発生しました")
            setIsPending(false)
          }
        })
      }
    } catch (error) {
      console.error(error)
      setError("画像の処理中にエラーが発生しました")
      setIsPending(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const maxFileSize = 2 * 1024 * 1024 // 2MB

      if (file.size > maxFileSize) {
        setError("ファイルサイズは2MBを超えることはできません")
        return
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        setError("jpg, jpeg, pngのみ対応しています")
        return
      }

      setImageFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ブログ編集</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
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
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="w-full aspect-video rounded-lg overflow-hidden relative">
                <Image
                  src={imagePreview}
                  alt="Blog cover image"
                  fill
                  className="object-cover"
                  priority
                />
                <label 
                  htmlFor="image-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <ImagePlus className="h-10 w-10 text-white" />
                </label>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                画像をクリックして変更 (最大2MB, jpg/jpeg/png)
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ブログのタイトルを入力" 
                        {...field} 
                        disabled={isPending} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>内容 (Markdown対応)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Markdownで記事を書けます。ヘッダー、リスト、コードブロックなどが使用可能です。"
                          rows={10}
                          {...field}
                          disabled={isPending}
                        />
                        <MarkdownHelp />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                編集を保存
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default BlogEdit