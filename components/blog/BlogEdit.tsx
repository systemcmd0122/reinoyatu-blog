"use client"

import React, { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, Wand2, ImagePlus } from "lucide-react"
import { editBlog, deleteBlog, generateTagsFromContent, generateAndSaveSummary } from "@/actions/blog" // generateAndSaveSummary を追加
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { BlogType, GenerationOptions } from "@/types"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BlogSchema } from "@/schemas"
import MarkdownHelp from "@/components/blog/markdown/MarkdownHelp"
import dynamic from 'next/dynamic'
import { generateBlogContent } from "@/utils/gemini"
import TagInput from "@/components/ui/TagInput"
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

const AICustomizeDialog = dynamic(
  () => import('@/components/blog/AICustomizeDialog'),
  { ssr: false }
)

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
  const [imagePreview, setImagePreview] = useState<string>(blog.image_url || "/noImage.png")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // AI関連の状態を追加
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [isTagGenerating, setIsTagGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false); // 追加

  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: blog.title,
      content: blog.content,
      summary: blog.summary || "", // 追加
      tags: blog.tags?.map(tag => tag.name) || [],
    },
  })

  // AI関連の機能を追加
  const handleAICustomizeClick = () => {
    const { content } = form.getValues()
    if (!content) {
      toast.error("記事の内容を入力してください")
      return
    }
    setGeneratedContent(null)
    setIsAIDialogOpen(true)
  }

  const handleGenerate = async (styles: string[], options: GenerationOptions) => {
    const { title, content } = form.getValues();
    setIsGenerating(true);
    
    try {
      const result = await generateBlogContent(title, content, styles, options);
      if (result.error) {
        toast.error(result.error);
      } else {
        setGeneratedContent(result.content);
      }
    } catch (error) {
      toast.error("AIによる生成中にエラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAIContent = (content: string) => {
    form.setValue("content", content, { shouldValidate: true })
    setIsAIDialogOpen(false)
    toast.success("AIが生成した内容を適用しました")
  }

  const handleGenerateTags = async () => {
    const { title, content } = form.getValues();

    if (!title || !content) {
      toast.error("AIでタグを生成するには、タイトルと内容の両方が必要です。");
      return;
    }

    setIsTagGenerating(true);
    try {
      const result = await generateTagsFromContent(title, content);
      if (result.error) {
        toast.error(result.error);
      } else if ("tags" in result && result.tags) {
        const currentTags = form.getValues("tags") || [];
        const newTags = [...new Set([...currentTags, ...result.tags])];
        form.setValue("tags", newTags, { shouldValidate: true });
        toast.success("AIがタグを提案しました。");
      }
    } catch (error) {
      toast.error("タグの生成中に予期せぬエラーが発生しました。");
    } finally {
      setIsTagGenerating(false);
    }
  };

  // AI要約生成機能を追加
  const handleGenerateSummary = async () => {
    const { title, content } = form.getValues();

    if (!title || !content) {
      toast.error("AIで要約を生成するには、タイトルと内容の両方が必要です。");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const result = await generateAndSaveSummary({ // 新しいサーバーアクションを呼び出す
        blogId: blog.id,
        title,
        content,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.summary) {
        form.setValue("summary", result.summary, { shouldValidate: true });
        toast.success("AIが要約を生成しました。");
      }
    } catch (error) {
      toast.error("要約の生成中に予期せぬエラーが発生しました。");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 既存の機能
  const onSubmit = async (values: z.infer<typeof BlogSchema>) => {
    if (isPending) return;
    
    setError("")
    setIsPending(true)

    try {
      if (imageFile) {
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const maxFileSize = 2 * 1024 * 1024

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

  const insertCodeBlock = (language: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = form.getValues("content")
    
    const codeBlockTemplate = `\`\`\`${language}\n\n\`\`\``
    
    const newText = text.substring(0, start) + codeBlockTemplate + text.substring(end)
    
    form.setValue("content", newText, { shouldValidate: true })
    
    setTimeout(() => {
      const newCursorPosition = start + language.length + 4
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
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
                    <div className="flex justify-between items-center">
                      <FormLabel>内容 (Markdown対応)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAICustomizeClick}
                        className="flex items-center space-x-2"
                      >
                        <Wand2 className="h-4 w-4" />
                        <span>AIでカスタマイズ</span>
                      </Button>
                    </div>
                    <FormControl>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Markdownで記事を書けます。ヘッダー、リスト、コードブロックなどが使用可能です。"
                          rows={10}
                          {...field}
                          disabled={isPending}
                          ref={textareaRef}
                        />
                        <MarkdownHelp onInsertCodeBlock={insertCodeBlock} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* summary FormField を追加 */}
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel>AI要約</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary || isPending}
                        className="flex items-center space-x-2"
                      >
                        {isGeneratingSummary ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        <span>AIで生成/更新</span>
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="AIが生成した要約、または手動で要約を入力"
                        rows={3}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      AIで生成するか、手動で記事の要約を入力してください。（最大200文字）
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                      <FormLabel>タグ</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateTags}
                        disabled={isTagGenerating || isPending}
                        className="flex items-center space-x-2"
                      >
                        {isTagGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        <span>AIで生成</span>
                      </Button>
                    </div>
                    <FormControl>
                      <TagInput
                        placeholder="タグを入力してEnter"
                        value={field.value || []}
                        onChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      タグを入力後、Enterキーを押してください。
                    </p>
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

      {/* AIカスタマイズダイアログ */}
      <AICustomizeDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        originalContent={{
          title: form.getValues("title"),
          content: form.getValues("content"),
        }}
        onApply={handleApplyAIContent}
        onGenerate={handleGenerate}
        generatedContent={generatedContent}
        isGenerating={isGenerating}
      />
    </div>
  )
}

export default BlogEdit