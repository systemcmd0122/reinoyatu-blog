"use client"

import React, { useState, useRef, useEffect, useTransition } from "react"
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
import { 
  Loader2, 
  ImagePlus, 
  X, 
  Wand2, 
  Upload, 
  Eye, 
  Tag, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Layout,
  Columns
} from "lucide-react"
import { BlogSchema } from "@/schemas"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MarkdownHelp from "@/components/blog/markdown/MarkdownHelp"
import { generateBlogContent, generateSummaryFromContent } from "@/utils/gemini"
import dynamic from "next/dynamic"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
import PreviewDialog from "./PreviewDialog"
import { motion, AnimatePresence } from "framer-motion"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import TagInput from "@/components/ui/TagInput"
import { BlogType, GenerationOptions } from "@/types"
import MarkdownRenderer from "./markdown/MarkdownRenderer"
import { format } from "date-fns"

const AICustomizeDialog = dynamic(
  () => import("@/components/blog/AICustomizeDialog"), 
  { ssr: false }
)

interface BlogEditorProps {
  initialData?: BlogType
  mode: "new" | "edit"
  userId: string
  onSubmit: (values: z.infer<typeof BlogSchema> & { base64Image?: string }) => Promise<{ error?: string; success?: boolean }>
  onDelete?: () => Promise<{ error?: string; success?: boolean }>
}

const BlogEditor: React.FC<BlogEditorProps> = ({ 
  initialData, 
  mode, 
  userId, 
  onSubmit,
  onDelete
}) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit")
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
      title: initialData?.title || "",
      content: initialData?.content || "",
      summary: initialData?.summary || "",
      tags: initialData?.tags?.map(t => t.name) || [],
    },
  })

  // localStorageからの復元
  useEffect(() => {
    const draftKey = mode === "new" ? "blog-new-draft" : `blog-edit-draft-${initialData?.id}`
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.title) form.setValue("title", draft.title)
        if (draft.content) form.setValue("content", draft.content)
        if (draft.summary) form.setValue("summary", draft.summary)
        if (draft.tags) form.setValue("tags", draft.tags)
        toast.info("下書きを復元しました")
      } catch (e) {
        console.error("Failed to restore draft", e)
      }
    }
  }, [form, mode, initialData?.id])

  // 自動保存
  useEffect(() => {
    const subscription = form.watch((value) => {
      const draftKey = mode === "new" ? "blog-new-draft" : `blog-edit-draft-${initialData?.id}`
      
      const isActuallyDirty = mode === "new" 
        ? !!(value.title || value.content || value.summary || (value.tags && value.tags.length > 0))
        : (value.title !== initialData?.title || 
           value.content !== initialData?.content || 
           value.summary !== (initialData?.summary || "") ||
           JSON.stringify(value.tags) !== JSON.stringify(initialData?.tags?.map(t => t.name) || []))

      if (isActuallyDirty) {
        localStorage.setItem(draftKey, JSON.stringify(value))
        setIsDirty(true)
        setLastSaved(new Date())
      } else {
        localStorage.removeItem(draftKey)
        setIsDirty(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, mode, initialData])

  // 離脱ガード
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const watchedTitle = form.watch("title")
  const watchedContent = form.watch("content")
  const watchedSummary = form.watch("summary")
  const watchedTags = form.watch("tags")

  const steps = [
    { id: 'basic', title: '基本情報', icon: FileText },
    { id: 'content', title: '記事執筆', icon: Layout },
    { id: 'details', title: '詳細設定', icon: Tag },
    { id: 'preview', title: '最終確認', icon: Eye }
  ]

  const handleFormSubmit = async (values: z.infer<typeof BlogSchema>) => {
    if (isPending) return
    
    setError("")
    setIsPending(true)

    try {
      let base64Image: string | undefined = undefined;
      if (imageFile) {
        try {
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(imageFile)
          })
        } catch (e) {
          setError("画像の処理中にエラーが発生しました。画像サイズが大きすぎるか、破損している可能性があります。")
          setIsPending(false)
          return
        }
      }

      const res = await onSubmit({ ...values, base64Image })

      if (res?.error) {
        // エラーメッセージのユーザーフレンドリー化
        if (res.error.includes("storage")) {
          setError("画像のアップロードに失敗しました。ファイル形式やサイズを確認してください。")
        } else if (res.error.includes("auth")) {
          setError("セッションが切れた可能性があります。一度ページを更新して再度お試しください。")
        } else if (res.error.includes("duplicate")) {
          setError("同じタイトルの記事が既に存在する可能性があります。")
        } else {
          setError(`送信に失敗しました: ${res.error}`)
        }
        setIsPending(false)
        return
      }

      toast.success(mode === "new" ? "ブログを投稿しました" : "ブログを更新しました")
      
      const draftKey = mode === "new" ? "blog-new-draft" : `blog-edit-draft-${initialData?.id}`
      localStorage.removeItem(draftKey)
      setIsDirty(false)

      setTimeout(() => {
        setIsPending(false)
        if (mode === "new") {
          router.push("/")
        } else {
          router.push(`/blog/${initialData?.id}`)
        }
        router.refresh()
      }, 1000)

    } catch (error) {
      console.error("Submission error:", error)
      setError("ネットワークエラーが発生しました。インターネット接続を確認して、もう一度「公開」ボタンを押してください。")
      setIsPending(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const maxFileSize = 2 * 1024 * 1024
      if (file.size > maxFileSize) {
        setError("画像サイズは2MB以下にしてください")
        return
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError("JPG, PNG, WebP形式のみ対応しています")
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const insertCodeBlock = (language: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = form.getValues("content")
    const codeBlockTemplate = `\n\`\`\`${language}\n\n\`\`\`\n`
    const newText = text.substring(0, start) + codeBlockTemplate + text.substring(end)
    form.setValue("content", newText, { shouldValidate: true })
    setTimeout(() => {
      const newCursorPosition = start + language.length + 5
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  const handleGenerateTags = async () => {
    const { title, content } = form.getValues();
    if (!title || !content) {
      toast.error("タイトルと本文を入力してください");
      return;
    }
    setIsTagGenerating(true);
    try {
      const { generateTagsFromContent } = await import("@/actions/blog")
      const result = await generateTagsFromContent(title, content);
      if (result.error) {
        toast.error(result.error);
      } else if ("tags" in result && result.tags) {
        const currentTags = form.getValues("tags") || [];
        const newTags = [...new Set([...currentTags, ...result.tags])];
        form.setValue("tags", newTags, { shouldValidate: true });
        toast.success("AIがタグを提案しました");
      }
    } catch (error) {
      toast.error("タグの生成中にエラーが発生しました");
    } finally {
      setIsTagGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    const { title, content } = form.getValues();
    if (!title || !content) {
      toast.error("タイトルと本文を入力してください");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      const result = await generateSummaryFromContent(title, content);
      if (result.error) {
        toast.error(result.error);
      } else if (result.summary) {
        form.setValue("summary", result.summary, { shouldValidate: true });
        toast.success("AIが要約を生成しました");
      }
    } catch (error) {
      toast.error("要約の生成中にエラーが発生しました");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const canProceed = (step: number) => {
    const values = form.getValues()
    if (step === 0) return !!values.title
    if (step === 1) return !!values.content
    return true
  }

  const getCompletionPercentage = () => {
    const values = form.getValues()
    let score = 0
    if (values.title) score += 25
    if (values.content) score += 40
    if (values.summary) score += 15
    if (values.tags && values.tags.length > 0) score += 10
    if (imagePreview) score += 10
    return score
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-20">
        {/* スティッキーヘッダー */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col flex-1 min-w-0">
                <h1 className="text-xs font-medium text-muted-foreground truncate">
                  {mode === "new" ? "新規記事の作成" : "記事の編集"}
                </h1>
                <p className="text-lg font-bold truncate">
                  {watchedTitle || "無題の記事"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center text-xs text-muted-foreground mr-4">
                {lastSaved ? (
                  <span className="flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                    保存済み: {format(lastSaved, "HH:mm:ss")}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-3 w-3 mr-1" />
                    未保存
                  </span>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>

              <Button 
                size="sm" 
                onClick={form.handleSubmit(handleFormSubmit)}
                disabled={isPending || !watchedTitle || !watchedContent}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {mode === "new" ? "公開する" : "更新する"}
              </Button>
            </div>
          </div>
          
          {/* 進捗インジケーター */}
          <div className="w-full h-1 bg-muted">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${getCompletionPercentage()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </header>

        <main className="container mx-auto py-8 px-4 max-w-5xl">
          {/* ステップナビゲーション */}
          <div className="grid grid-cols-4 gap-2 mb-10">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === index
              const isCompleted = currentStep > index
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => index <= currentStep || canProceed(currentStep) ? setCurrentStep(index) : null}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border-2 transition-all group",
                    isActive 
                      ? "border-primary bg-primary/5 text-primary" 
                      : isCompleted
                        ? "border-primary/50 bg-background text-primary/70 hover:border-primary"
                        : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                  )}
                >
                  <StepIcon className={cn("h-5 w-5 mb-1", isActive && "animate-pulse")} />
                  <span className="text-xs font-bold hidden md:block">{step.title}</span>
                </button>
              )
            })}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8 border-2 bg-destructive/5 dark:bg-destructive/10">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-bold text-lg">エラーが発生しました</AlertTitle>
              <AlertDescription className="space-y-4 pt-2">
                <p className="text-base leading-relaxed opacity-90">{error}</p>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => form.handleSubmit(handleFormSubmit)()}
                    className="h-9 px-4 font-bold shadow-md shadow-destructive/20"
                  >
                    再試行
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setError("")}
                    className="h-9 px-4 border-destructive/20 hover:bg-destructive/10 text-destructive font-bold"
                  >
                    閉じる
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 && (
                    <Card className="border-border shadow-md">
                      <CardContent className="pt-6 space-y-8">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-bold">タイトル</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="タイトルを入力してください"
                                  className="h-14 text-xl font-bold border-2 focus:ring-primary"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <FormLabel className="text-lg font-bold block">カバー画像</FormLabel>
                          <div className="relative">
                            {!imagePreview ? (
                              <label 
                                htmlFor="image-upload" 
                                className="flex flex-col items-center justify-center aspect-video rounded-xl border-3 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                              >
                                <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                  <ImagePlus className="h-10 w-10 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <div className="mt-4 text-center">
                                  <p className="font-bold text-foreground">クリックして画像をアップロード</p>
                                  <p className="text-sm text-muted-foreground">JPG, PNG, WebP (最大2MB)</p>
                                </div>
                                <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                              </label>
                            ) : (
                              <div className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-lg group">
                                <Image src={imagePreview} alt="Cover Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                  <Button type="button" variant="secondary" onClick={() => document.getElementById('image-upload-replace')?.click()}>
                                    <Upload className="h-4 w-4 mr-2" /> 変更
                                  </Button>
                                  <Button type="button" variant="destructive" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                                    <X className="h-4 w-4 mr-2" /> 削除
                                  </Button>
                                  <input id="image-upload-replace" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-card p-2 rounded-t-lg border border-b-0 border-border">
                        <div className="flex items-center space-x-1">
                          <Button 
                            type="button" 
                            variant={viewMode === 'edit' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setViewMode('edit')}
                          >
                            編集
                          </Button>
                          <Button 
                            type="button" 
                            variant={viewMode === 'split' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setViewMode('split')}
                            className="hidden lg:flex"
                          >
                            <Columns className="h-4 w-4 mr-2" />
                            分割
                          </Button>
                          <Button 
                            type="button" 
                            variant={viewMode === 'preview' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setViewMode('preview')}
                          >
                            プレビュー
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MarkdownHelp onInsertCodeBlock={insertCodeBlock} />
                          <Button 
                            type="button" 
                            variant="default" 
                            size="sm"
                            onClick={() => setIsAIDialogOpen(true)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            AI
                          </Button>
                        </div>
                      </div>

                      <div className={cn(
                        "grid gap-0 border border-border rounded-b-lg overflow-hidden",
                        viewMode === 'split' ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                      )}>
                        {(viewMode === 'edit' || viewMode === 'split') && (
                          <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Textarea 
                                    {...field}
                                    ref={textareaRef}
                                    placeholder="ここから物語が始まります..."
                                    className={cn(
                                      "min-h-[600px] h-[70vh] text-lg leading-relaxed font-mono border-0 rounded-none focus-visible:ring-0 resize-none p-6",
                                      viewMode === 'split' && "lg:border-r border-border"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {(viewMode === 'preview' || viewMode === 'split') && (
                          <div className={cn(
                            "bg-card p-8 overflow-y-auto prose prose-lg dark:prose-invert max-w-none min-h-[600px] h-[70vh]",
                            viewMode === 'split' ? "lg:border-l-0" : ""
                          )}>
                            <MarkdownRenderer content={watchedContent || "*プレビューする内容がありません*"} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <Card className="border-border shadow-md">
                      <CardContent className="pt-6 space-y-8">
                        <FormField
                          control={form.control}
                          name="summary"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-lg font-bold">要約</FormLabel>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleGenerateSummary}
                                  disabled={isGeneratingSummary}
                                >
                                  {isGeneratingSummary ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                  AIで生成
                                </Button>
                              </div>
                              <FormControl>
                                <Textarea 
                                  placeholder="内容を簡潔にまとめてください..."
                                  className="h-32 text-base border-2"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-lg font-bold">タグ</FormLabel>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleGenerateTags}
                                  disabled={isTagGenerating}
                                >
                                  {isTagGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                                  AIで提案
                                </Button>
                              </div>
                              <FormControl>
                                <TagInput 
                                  value={field.value || []}
                                  onChange={field.onChange}
                                  placeholder="タグを入力（Enterで追加）"
                                  className="border-2"
                                />
                              </FormControl>
                              <p className="text-sm text-muted-foreground mt-2">最大10個まで設定できます</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">最終確認</h2>
                        <p className="text-muted-foreground">公開前の最終チェックをしましょう。</p>
                      </div>

                      <Card className="border-border overflow-hidden shadow-xl">
                        <div className="aspect-video relative">
                          <Image src={imagePreview || "/placeholder-blog.jpg"} alt="Hero" fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                            <h3 className="text-3xl md:text-4xl font-bold text-white line-clamp-2">{watchedTitle}</h3>
                          </div>
                        </div>
                        <CardContent className="p-8 space-y-6">
                          {watchedTags && watchedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {watchedTags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">#{tag}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-muted-foreground text-lg leading-relaxed italic border-l-4 border-primary pl-4">
                            {watchedSummary || "要約が設定されていません。"}
                          </p>
                          <Separator />
                          <div className="prose prose-lg dark:prose-invert max-w-none">
                            <MarkdownRenderer content={watchedContent} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* フッターナビゲーション */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="lg"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-8"
                >
                  戻る
                </Button>
                
                <div className="flex items-center space-x-4">
                  {mode === "edit" && onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="text-destructive hover:bg-destructive/10"
                          disabled={isPending || isDeleting}
                        >
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            この操作は取り消せません。記事の内容、コメント、いいねなどのすべてのデータが永久に削除されます。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={async () => {
                              setIsDeleting(true)
                              try {
                                const res = await onDelete()
                                if (res.error) {
                                  toast.error(res.error)
                                  setIsDeleting(false)
                                } else {
                                  toast.success("記事を削除しました")
                                  router.push("/")
                                  router.refresh()
                                }
                              } catch (e) {
                                toast.error("削除中にエラーが発生しました")
                                setIsDeleting(false)
                              }
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 削除中...</>
                            ) : (
                              "削除する"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <Button 
                      type="button" 
                      size="lg"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      disabled={!canProceed(currentStep)}
                      className="px-10"
                    >
                      次へ
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={isPending || !watchedTitle || !watchedContent}
                      className="px-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                      {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                      {mode === "new" ? "記事を公開する" : "変更を保存する"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </main>

        <PreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={watchedTitle}
          content={watchedContent}
          summary={watchedSummary}
          tags={watchedTags}
          imagePreview={imagePreview}
        />

        <AICustomizeDialog
          isOpen={isAIDialogOpen}
          onClose={() => setIsAIDialogOpen(false)}
          originalContent={{
            title: form.getValues("title"),
            content: form.getValues("content"),
          }}
          onApply={(content) => {
            form.setValue("content", content, { shouldValidate: true })
            setIsAIDialogOpen(false)
            toast.success("AIの提案を適用しました")
          }}
          onGenerate={async (styles, options) => {
            setIsGenerating(true)
            try {
              const res = await generateBlogContent(form.getValues("title"), form.getValues("content"), styles, options)
              if (res.error) toast.error(res.error)
              else setGeneratedContent(res.content)
            } finally {
              setIsGenerating(false)
            }
          }}
          generatedContent={generatedContent}
          isGenerating={isGenerating}
        />
        
        {(isPending || isDeleting) && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
            <div className="flex flex-col items-center space-y-6 text-center max-w-sm px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black tracking-tighter">
                  {isDeleting ? "DELETING" : mode === "new" ? "PUBLISHING" : "SAVING CHANGES"}
                </p>
                <p className="text-muted-foreground text-sm font-medium">
                  {isDeleting
                    ? "記事を安全に削除しています。少々お待ちください..."
                    : mode === "new"
                      ? "素晴らしい記事を世界中に届けています。少々お待ちください..."
                      : "変更を安全に保存しています。まもなく完了します..."}
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  className="bg-primary h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default BlogEditor