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
import { Loader2, ImagePlus, X } from "lucide-react"
import { BlogSchema } from "@/schemas"
import { newBlog } from "@/actions/blog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import MarkdownHelp from "@/components/blog/markdown/MarkdownHelp"

interface BlogNewProps {
  userId: string
}

const BlogNew: React.FC<BlogNewProps> = ({ userId }) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: "",
      content: "",
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

        // 画像が読み込まれた後で投稿処理を実行
        startTransition(async () => {
          try {
            const res = await newBlog({
              ...values,
              base64Image,
              userId,
            })

            if (res?.error) {
              setError(res.error)
              setIsPending(false)
              return
            }

            toast.success("ブログを投稿しました")
            router.push("/")
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
            const res = await newBlog({
              ...values,
              base64Image: undefined,
              userId,
            })

            if (res?.error) {
              setError(res.error)
              setIsPending(false)
              return
            }

            toast.success("ブログを投稿しました")
            router.push("/")
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

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">ブログ投稿</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            {!imagePreview ? (
              <div className="flex flex-col items-center justify-center">
                <label 
                  htmlFor="image-upload" 
                  className="w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                  <span className="mt-2 text-muted-foreground">
                    ファイル選択またはドラッグ＆ドロップ
                  </span>
                  <span className="text-xs text-muted-foreground">
                    対応形式: jpg / jpeg / png (最大2MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden relative">
                  <Image
                    src={imagePreview}
                    alt="Selected image"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-5 w-5" />
                </Button>
                <label 
                  htmlFor="image-upload-replace" 
                  className="absolute bottom-2 left-1/2 -translate-x-1/2"
                >
                  <Button variant="outline" size="sm">
                    画像を変更
                  </Button>
                  <input
                    id="image-upload-replace"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            )}
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
                投稿
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default BlogNew