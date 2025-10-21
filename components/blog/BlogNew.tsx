"use client"

import React, { useState, useRef, useTransition } from "react"
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
import { Loader2, ImagePlus, X, Wand2, Upload, Eye, Tag, FileText } from "lucide-react"
import { BlogSchema } from "@/schemas"
import { newBlog, generateTagsFromContent } from "@/actions/blog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import MarkdownHelp from "@/components/blog/markdown/MarkdownHelp"
import { generateBlogContent, generateSummaryFromContent } from "@/utils/gemini"
import { LoadingState } from "@/components/ui/loading-state"
import dynamic from "next/dynamic"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import PreviewDialog from "./PreviewDialog"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"


const AICustomizeDialog = dynamic(
  () => import("@/components/blog/AICustomizeDialog"), 
  { ssr: false }
)
import { GenerationOptions } from "@/types";
import TagInput from "@/components/ui/TagInput";
import { useAuth } from "@/hooks/use-auth";

interface BlogNewProps {
  userId: string
}

const BlogNew: React.FC<BlogNewProps> = ({ userId }) => {
  const router = useRouter()
  useAuth()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // AI関連の状態
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [isTagGenerating, setIsTagGenerating] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      tags: [],
    },
  })

  const watchedTitle = form.watch("title")
  const watchedContent = form.watch("content")
  const watchedSummary = form.watch("summary")
  const watchedTags = form.watch("tags")

  const steps = [
    { id: 'basic', title: '基本情報', icon: FileText },
    { id: 'content', title: '記事作成', icon: FileText },
    { id: 'details', title: '詳細設定', icon: Tag },
    { id: 'preview', title: '確認・投稿', icon: Eye }
  ]

  const onSubmit = async (values: z.infer<typeof BlogSchema>) => {
    if (isPending) return;
    
    setError("")
    setIsPending(true)

    try {
      // 画像の処理
      let base64Image: string | undefined = undefined;
      if (imageFile) {
        try {
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(imageFile)
          })
        } catch (error) {
          console.error("画像の処理中にエラーが発生:", error)
          setError("画像の処理中にエラーが発生しました")
          setIsPending(false)
          return
        }
      }

      // 記事の投稿
      const res = await newBlog({
        ...values,
        base64Image,
        userId,
      })

      if (res?.error) {
        console.error("投稿エラー:", res.error)
        setError(res.error)
        setIsPending(false)
        return
      }

      // 成功時の処理
      toast.success("ブログを投稿しました", {
        duration: 1500,
      })

      // 少し待ってからリダイレクト
      setTimeout(() => {
        setIsPending(false)
        router.push("/")
        router.refresh()
      }, 1500)

    } catch (error) {
      console.error("投稿処理中にエラーが発生:", error)
      setError(error instanceof Error ? error.message : "エラーが発生しました")
      setIsPending(false)
    }
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

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
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

  const handleGenerateSummary = async () => {
    const { title, content } = form.getValues();

    if (!title || !content) {
      toast.error("AIで要約を生成するには、タイトルと内容の両方が必要です。");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const result = await generateSummaryFromContent(title, content);
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

  const canProceedToNext = (step: number): boolean => {
    const values = form.getValues()
    switch (step) {
      case 0:
        return !!values.title
      case 1:
        return !!values.content
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  const getCompletionStatus = () => {
    const values = form.getValues()
    let completed = 0
    const total = 5

    if (values.title) completed++
    if (imagePreview) completed++
    if (values.content) completed++
    if (values.summary) completed++
    if (values.tags && values.tags.length > 0) completed++

    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const status = getCompletionStatus()


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto py-8 px-4">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              新しい記事を作成
            </h1>
            <p className="text-gray-600">
              ステップに従って記事を作成しましょう
            </p>
          </div>

          {/* プログレスバー */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">進捗状況</span>
              <span className="text-sm text-gray-500">{status.completed} / {status.total} 完了</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${status.percentage}%` }}
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* 編集エリア */}
            <div className="space-y-6">
              {/* ステップインジケーター */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon
                    return (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => setCurrentStep(index)}
                            className={cn(
                              "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all mb-2",
                              index === currentStep
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : index < currentStep
                                ? 'bg-blue-50 border-blue-600 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-400'
                            )}
                          >
                            <StepIcon className="h-5 w-5" />
                          </button>
                          <span className={cn(
                            "text-xs font-medium text-center",
                            index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                          )}>
                            {step.title}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className={cn(
                            "flex-1 h-0.5 mx-2 mt-6",
                            index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                          )} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {isPending && <LoadingState message="ブログを投稿中です..." />}
      
      <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs value={steps[currentStep].id} className="space-y-6">
                    {/* ステップ1: 基本情報 */}
                    <TabsContent value="basic" className="space-y-6">
                      <Card className="border border-gray-200 shadow-sm">
                        <CardContent className="pt-6 space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base font-semibold text-gray-900">
                                  タイトル <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="記事のタイトルを入力してください"
                                    className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    {...field} 
                                    disabled={isPending} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator className="my-6" />

                          <div className="space-y-4">
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 mb-1">カバー画像</h3>
                              <p className="text-sm text-gray-500">記事のサムネイル画像をアップロード</p>
                            </div>

                            {!imagePreview ? (
                              <label 
                                htmlFor="image-upload" 
                                className="block w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all"
                              >
                                <input
                                  id="image-upload"
                                  type="file"
                                  accept="image/jpeg,image/png,image/jpg"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                                <div className="flex flex-col items-center justify-center h-full space-y-3">
                                  <div className="p-3 bg-gray-100 rounded-full">
                                    <ImagePlus className="h-8 w-8 text-gray-600" />
                                  </div>
                                  <div className="text-center">
                                    <p className="font-medium text-gray-700">
                                      画像をアップロード
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      JPG, PNG (最大2MB)
                                    </p>
                                  </div>
                                </div>
                              </label>
                            ) : (
                              <div className="relative group">
                                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                                  <Image
                                    src={imagePreview}
                                    alt="Selected image"
                                    fill
                                    className="object-cover"
                                    priority
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                                    <label htmlFor="image-upload-replace">
                                      <Button type="button" variant="secondary" size="sm" className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-2" />
                                        変更
                                      </Button>
                                      <input
                                        id="image-upload-replace"
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                      />
                                    </label>
                                    <Button type="button" variant="destructive" size="sm" onClick={removeImage}>
                                      <X className="h-4 w-4 mr-2" />
                                      削除
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* ステップ2: 記事作成 */}
                    <TabsContent value="content" className="space-y-6">
                      <Card className="border border-gray-200">
                        <CardContent className="pt-6">
                          <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-4">
                                  <FormLabel className="text-base font-semibold text-gray-900">
                                    記事内容 <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setIsPreviewOpen(true)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      プレビュー
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="sm"
                                      onClick={handleAICustomizeClick}
                                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                      <Wand2 className="h-4 w-4 mr-2" />
                                      AIアシスタント
                                    </Button>
                                  </div>
                                </div>
                                <FormControl>
                                  <div className="space-y-4">
                                    <Textarea
                                      placeholder="記事の内容をMarkdown形式で記述してください..."
                                      rows={16}
                                      className="text-base leading-relaxed font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* ステップ3: 詳細設定 */}
                    <TabsContent value="details" className="space-y-6">
                      <Card className="border border-gray-200">
                        <CardContent className="pt-6 space-y-6">
                          <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-3">
                                  <FormLabel className="text-base font-semibold text-gray-900">
                                    要約
                                  </FormLabel>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateSummary}
                                    disabled={isGeneratingSummary || isPending}
                                  >
                                    {isGeneratingSummary ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Wand2 className="h-4 w-4 mr-2" />
                                    )}
                                    AI生成
                                  </Button>
                                </div>
                                <FormControl>
                                  <Textarea
                                    placeholder="記事の要約を入力してください（200文字以内推奨）"
                                    rows={4}
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <p className="text-sm text-gray-500">
                                  記事の概要を簡潔にまとめてください
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator />

                          <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between mb-3">
                                  <FormLabel className="text-base font-semibold text-gray-900">
                                    タグ
                                  </FormLabel>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateTags}
                                    disabled={isTagGenerating || isPending}
                                  >
                                    {isTagGenerating ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Wand2 className="h-4 w-4 mr-2" />
                                    )}
                                    AI提案
                                  </Button>
                                </div>
                                <FormControl>
                                  <TagInput
                                    placeholder="タグを入力してEnterキーを押してください"
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <p className="text-sm text-gray-500">
                                  記事を見つけやすくするタグを追加してください
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* ステップ4: プレビュー・投稿 */}
                    <TabsContent value="preview" className="space-y-6">
                      <Card className="border border-gray-200">
                        <CardContent className="pt-6 space-y-6">
                          <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">投稿の準備が整いました</h2>
                            <p className="text-gray-600">内容を確認して、公開しましょう</p>
                          </div>

                          {error && (
                            <Alert variant="destructive">
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}

                          <div className="flex justify-center mt-8">
                            <Button 
                              type="submit" 
                              size="lg"
                              className="px-10 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                              disabled={isPending || !watchedTitle || !watchedContent}
                            >
                              {isPending ? (
                                <div className="flex items-center space-x-2">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  <span>投稿中...</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Upload className="h-5 w-5" />
                                  <span>投稿する</span>
                                </div>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {/* ナビゲーションボタン */}
                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      className="px-6"
                    >
                      前へ
                    </Button>
                    {currentStep < steps.length - 1 && (
                      <Button 
                        type="button"
                        onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                        disabled={!canProceedToNext(currentStep)}
                        className="px-6 bg-blue-600 hover:bg-blue-700"
                      >
                        次へ
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* プレビューダイアログ */}
        <PreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={watchedTitle}
          content={watchedContent}
          summary={watchedSummary}
          tags={watchedTags}
          imagePreview={imagePreview}
        />

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
    </TooltipProvider>
  )
}

export default BlogNew