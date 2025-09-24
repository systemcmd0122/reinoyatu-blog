"use client"

import React, { useState, useTransition, useRef } from "react"
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
import { Loader2, ImagePlus, X, Wand2, Upload, Save, Eye, HelpCircle, Sparkles, MessageCircle } from "lucide-react"
import { BlogSchema } from "@/schemas"
import { newBlog, generateTagsFromContent } from "@/actions/blog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import MarkdownHelp from "@/components/blog/markdown/MarkdownHelp"
import { generateBlogContent, generateSummaryFromContent } from "@/utils/gemini"
import dynamic from "next/dynamic"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const AICustomizeDialog = dynamic(
  () => import("@/components/blog/AICustomizeDialog"), 
  { ssr: false }
)

const AIChatDialog = dynamic(
  () => import('@/components/blog/AIChatDialog').then(mod => mod.AIChatDialog),
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
  const [, startTransition] = useTransition()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // AI関連の状態
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [isTagGenerating, setIsTagGenerating] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // AIチャットの応答を適用する
  const applyAIResponse = (response: string) => {
    const { content } = form.getValues()
    const cursorPosition = textareaRef.current?.selectionStart || content.length
    const newContent = 
      content.slice(0, cursorPosition) + 
      response + 
      content.slice(cursorPosition)
    form.setValue("content", newContent)
  }

  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      tags: [],
    },
  })

  const steps = [
    { id: 'basic', title: '基本情報', description: 'タイトルと画像を設定' },
    { id: 'content', title: '記事作成', description: '内容を作成・編集' },
    { id: 'details', title: '詳細設定', description: '要約・タグを設定' },
    { id: 'preview', title: '確認・投稿', description: '内容を確認して投稿' }
  ]

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
        return true // 詳細設定は任意
      case 3:
        return true
      default:
        return false
    }
  }

  const getCompletionStatus = () => {
    const values = form.getValues()
    let completed = 0
    const total = 6

    if (values.title) completed++
    if (imagePreview) completed++
    if (values.content) completed++
    if (values.summary) completed++
    if (values.tags && values.tags.length > 0) completed++
    completed++ // 基本的に1つはクリア

    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const status = getCompletionStatus()

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-4xl py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              新しいブログを作成
            </h1>
            <p className="text-muted-foreground mt-2">
              簡単なステップであなたの記事を世界に公開しましょう
            </p>
          </div>

          {/* プログレスバー */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">完成度</span>
              <span className="text-sm text-muted-foreground">{status.completed}/{status.total} 完了</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <Tabs value={steps[currentStep].id} className="space-y-6">
          {/* ステップインジケーター */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      index <= currentStep
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ステップ1: 基本情報 */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      <span>基本情報を設定</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center space-x-2">
                            <span>ブログタイトル</span>
                            <Badge variant="destructive" className="text-xs">必須</Badge>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="魅力的なタイトルを入力してください..."
                              className="text-lg h-12"
                              {...field} 
                              disabled={isPending} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">カバー画像</h3>
                        <Badge variant="secondary" className="text-xs">推奨</Badge>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>記事の第一印象を決める重要な要素です</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {!imagePreview ? (
                        <label 
                          htmlFor="image-upload" 
                          className="block w-full aspect-video border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                        >
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                              <ImagePlus className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-medium text-gray-700">
                                画像をアップロード
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                ドラッグ&ドロップまたはクリックして選択
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                JPG, PNG対応 (最大2MB)
                              </p>
                            </div>
                          </div>
                        </label>
                      ) : (
                        <div className="relative group">
                          <div className="aspect-video rounded-xl overflow-hidden relative">
                            <Image
                              src={imagePreview}
                              alt="Selected image"
                              fill
                              className="object-cover"
                              priority
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                              <label htmlFor="image-upload-replace">
                                <Button variant="secondary" size="sm" className="cursor-pointer">
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
                              <Button variant="destructive" size="sm" onClick={removeImage}>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-green-500" />
                        <span>記事内容を作成</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAICustomizeClick}
                          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
                        >
                          <Wand2 className="h-4 w-4" />
                          <span>AIアシスタント</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAIChatOpen(true)}
                          className="flex items-center space-x-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>AIチャット</span>
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center space-x-2">
                            <span>記事内容</span>
                            <Badge variant="destructive" className="text-xs">必須</Badge>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="あなたの素晴らしいアイデアをここに書いてください... 

Markdownを使って以下のような装飾ができます：
# 見出し
**太字** *斜体*
- リスト項目
```code
コードブロック
```"
                                rows={15}
                                className="text-base leading-relaxed"
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
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>AI要約</span>
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
                          <span>AI生成</span>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="記事の要約を入力するか、AIに生成させることができます..."
                                rows={4}
                                {...field}
                                disabled={isPending}
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              読者が記事の概要を素早く理解できるよう、200文字以内で要約してください
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>タグ</span>
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
                          <span>AI提案</span>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TagInput
                                placeholder="タグを入力してEnterキーを押してください..."
                                value={field.value || []}
                                onChange={field.onChange}
                                disabled={isPending}
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              記事を見つけやすくするタグを追加してください。関連するキーワードを入力してEnterで確定します
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ステップ4: プレビュー・投稿 */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">投稿前の最終確認</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* プレビュー */}
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <div className="space-y-4">
                        {imagePreview && (
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <Image
                              src={imagePreview}
                              alt="Cover"
                              width={800}
                              height={400}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <h2 className="text-2xl font-bold">{form.watch("title") || "タイトルが入力されていません"}</h2>
                        {form.watch("summary") && (
                          <p className="text-gray-600 bg-blue-50 p-4 rounded-lg">
                            {form.watch("summary")}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(form.watch("tags") || []).map(tag => (
                            <Badge key={tag} variant="secondary">#{tag}</Badge>
                          ))}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-600">
                            {form.watch("content") ? 
                              `${form.watch("content").slice(0, 200)}${form.watch("content").length > 200 ? '...' : ''}` : 
                              "記事内容が入力されていません"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-center">
                      <Button 
                        type="submit" 
                        size="lg"
                        className="px-8 py-4 text-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        disabled={isPending || !form.watch("title") || !form.watch("content")}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            投稿中...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            ブログを投稿する
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Form>

          {/* AIチャットダイアログ */}
          <AIChatDialog
            open={isAIChatOpen}
            onOpenChange={setIsAIChatOpen}
            onApplyContent={applyAIResponse}
            currentContent={form.getValues("content")}
            title={form.getValues("title") || "新規ブログ記事"}
          />

          {/* ナビゲーションボタン */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              前へ
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={!canProceedToNext(currentStep)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                次へ
              </Button>
            ) : (
              <div /> // 空のdivで右寄せを維持
            )}
          </div>
        </Tabs>

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