"use client"

import React, { useState, useRef, useEffect } from "react"
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
  Columns,
  MessageSquare,
  Sparkles,
  PanelRight
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import PreviewDialog from "./PreviewDialog"
import { motion, AnimatePresence } from "framer-motion"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import TagInput from "@/components/ui/TagInput"
import { BlogType } from "@/types"
import MarkdownRenderer from "./markdown/MarkdownRenderer"
import { format } from "date-fns"
import EditorChat from "./EditorChat"


const AICustomizeDialog = dynamic(
  () => import("@/components/blog/AICustomizeDialog"), 
  { ssr: false }
)

interface BlogEditorProps {
  initialData?: BlogType
  mode: "new" | "edit"
  userId: string
  onSubmit: (values: z.infer<typeof BlogSchema> & { base64Image?: string }) => Promise<{ error?: string; success?: boolean; id?: string }>
  onDelete?: () => Promise<{ error?: string; success?: boolean }>
}

type EditorStatus = "idle" | "saving-draft" | "publishing" | "deleting"

const BlogEditor: React.FC<BlogEditorProps> = ({ 
  initialData, 
  mode, 
  userId, 
  onSubmit,
  onDelete
}) => {
  const router = useRouter()
  const [error, setError] = useState("")
  const [status, setStatus] = useState<EditorStatus>("idle")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData?.updated_at ? new Date(initialData.updated_at) : null)
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // AI関連の状態
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [isTagGenerating, setIsTagGenerating] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isTitleGenerating, setIsTitleGenerating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    type: "summary" | "tags" | "titles"
    content: string | string[]
  } | null>(null)

  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      summary: initialData?.summary || "",
      tags: initialData?.tags?.map(t => t.name) || [],
      is_published: initialData?.is_published || false,
    },
  })

  // フォームの変更を監視（汚れフラグのみ）
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(true)
    })
    return () => subscription.unsubscribe()
  }, [form])

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
  const watchedIsPublished = form.watch("is_published")

  const steps = [
    { id: 'basic', title: '基本情報', icon: FileText },
    { id: 'content', title: '記事執筆', icon: Layout },
    { id: 'details', title: '詳細設定', icon: Tag },
    { id: 'preview', title: '最終確認', icon: Eye }
  ]

  const handleAction = async (isPublished: boolean) => {
    if (status !== "idle") return
    
    setError("")
    setStatus(isPublished ? "publishing" : "saving-draft")

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
          setError("画像の処理中にエラーが発生しました。")
          setStatus("idle")
          return
        }
      }

      // 値をセット
      form.setValue("is_published", isPublished)
      const values = form.getValues()

      const res = await onSubmit({ ...values, base64Image })

      if (res?.error) {
        setError(`送信に失敗しました: ${res.error}`)
        setStatus("idle")
        return
      }

      toast.success(isPublished ? "記事を公開しました" : "下書きを保存しました")
      setIsDirty(false)
      setLastSaved(new Date())
      setStatus("idle")

      if (isPublished) {
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 1000)
      } else if (mode === "new" && res.id) {
        // 新規作成から下書き保存した場合は、編集画面にリダイレクト
        setTimeout(() => {
          router.push(`/blog/${res.id}/edit`)
          router.refresh()
        }, 1000)
      }

    } catch (error) {
      console.error("Submission error:", error)
      setError("ネットワークエラーが発生しました。")
      setStatus("idle")
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
      setIsDirty(true)
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
    setAiSuggestion(null);
    try {
      const { generateTagsFromContent } = await import("@/actions/blog")
      const result = await generateTagsFromContent(title, content);
      if (result.error) {
        toast.error(result.error);
      } else if (result.tags) {
        setAiSuggestion({ type: "tags", content: result.tags });
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
    setAiSuggestion(null);
    try {
      const result = await generateSummaryFromContent(title, content);
      if (result.error) {
        toast.error(result.error);
      } else if (result.summary) {
        setAiSuggestion({ type: "summary", content: result.summary });
      }
    } catch (error) {
      toast.error("要約の生成中にエラーが発生しました");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateTitles = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast.error("タイトルを提案するには本文を入力してください");
      return;
    }
    setIsTitleGenerating(true);
    setAiSuggestion(null);
    try {
      const { generateTitleSuggestionsFromContent } = await import("@/actions/blog")
      const result = await generateTitleSuggestionsFromContent(content);
      if (result.error) {
        toast.error(result.error);
      } else if (result.titles) {
        setAiSuggestion({ type: "titles", content: result.titles });
      }
    } catch (error) {
      toast.error("タイトルの提案中にエラーが発生しました");
    } finally {
      setIsTitleGenerating(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    
    if (aiSuggestion.type === "summary") {
      form.setValue("summary", aiSuggestion.content as string, { shouldValidate: true });
      toast.success("要約を適用しました");
    } else if (aiSuggestion.type === "tags") {
      const currentTags = form.getValues("tags") || [];
      const newTags = [...new Set([...currentTags, ...(aiSuggestion.content as string[])])];
      form.setValue("tags", newTags, { shouldValidate: true });
      toast.success("タグを適用しました");
    }
    setAiSuggestion(null);
  };

  const handleApplyChatSuggestion = (content: string, mode: 'append' | 'replace') => {
    if (mode === 'append') {
      const current = form.getValues("content")
      form.setValue("content", current + "\n\n" + content, { shouldValidate: true })
    } else {
      form.setValue("content", content, { shouldValidate: true })
    }
    toast.success("AIの提案を本文に反映しました")
  }

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
      <div className="min-h-screen bg-background flex flex-col">
        {/* スティッキーヘッダー */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-screen-2xl mx-auto px-8 h-20 flex items-center justify-between gap-8">
            <div className="flex items-center space-x-6 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="hover:bg-muted shrink-0 h-12 w-12"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="flex flex-col flex-1 min-w-0">
                <h1 className="text-xs font-bold text-muted-foreground truncate uppercase tracking-[0.2em] mb-1">
                  {mode === "new" ? "New Story" : "Edit Story"}
                </h1>
                <p className="text-xl font-black tracking-tight truncate">
                  {watchedTitle || "無題の記事"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="hidden md:flex items-center text-xs text-muted-foreground mr-2">
                {lastSaved ? (
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full border border-border">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    保存: {format(lastSaved, "HH:mm")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full border border-border">
                    <Save className="h-3 w-3" />
                    未保存
                  </span>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("hidden sm:flex gap-2", isChatOpen && "bg-primary/10 text-primary")}
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <MessageSquare className="h-4 w-4" />
                AIチャット
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex"
                onClick={() => handleAction(false)}
                disabled={status !== "idle" || !watchedTitle || !watchedContent}
              >
                {status === "saving-draft" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                下書き保存
              </Button>

              <Button 
                size="sm" 
                onClick={() => handleAction(true)}
                disabled={status !== "idle" || !watchedTitle || !watchedContent}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              >
                {status === "publishing" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {watchedIsPublished ? "更新する" : "公開する"}
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

        <div className="flex-1 flex overflow-hidden">
          {/* メイン編集エリア */}
          <main className="flex-1 overflow-y-auto py-8 px-8">
            <div className="max-w-screen-2xl mx-auto pb-20">
              {/* ステップナビゲーション */}
              <div className="grid grid-cols-4 gap-6 mb-16">
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
                        "flex flex-col items-center p-5 rounded-xl border-2 transition-all group",
                        isActive 
                          ? "border-primary bg-primary/5 text-primary shadow-md ring-4 ring-primary/5"
                          : isCompleted
                            ? "border-primary/40 bg-background text-primary/80 hover:border-primary hover:bg-primary/5"
                            : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      <StepIcon className={cn("h-7 w-7 mb-2", isActive && "animate-pulse")} />
                      <span className="text-xs font-black hidden md:block uppercase tracking-widest">{step.title}</span>
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
                        onClick={() => handleAction(false)}
                        className="h-9 px-4 font-bold shadow-md shadow-destructive/20"
                      >
                        下書き保存を再試行
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
                <form className="space-y-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {currentStep === 0 && (
                        <div className="space-y-6">
                          <AnimatePresence mode="wait">
                            {aiSuggestion && aiSuggestion.type === "titles" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <Alert className="border-primary/50 bg-primary/5 mb-6">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <AlertTitle className="font-bold flex items-center justify-between">
                                    AIによるタイトルの提案
                                    <Button size="sm" variant="ghost" onClick={() => setAiSuggestion(null)}>閉じる</Button>
                                  </AlertTitle>
                                  <AlertDescription className="mt-4 grid gap-2">
                                    {(aiSuggestion.content as string[]).map((title, i) => (
                                      <Button 
                                        key={i} 
                                        variant="outline" 
                                        className="justify-start h-auto py-2 px-4 text-left whitespace-normal font-medium hover:bg-primary/10 hover:border-primary transition-all"
                                        onClick={() => {
                                          form.setValue("title", title, { shouldValidate: true });
                                          setAiSuggestion(null);
                                          toast.success("タイトルを適用しました");
                                        }}
                                      >
                                        {title}
                                      </Button>
                                    ))}
                                  </AlertDescription>
                                </Alert>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <Card className="border-border shadow-md">
                            <CardContent className="p-10 space-y-12">
                              <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                      <FormLabel className="text-lg font-bold">タイトル</FormLabel>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleGenerateTitles}
                                        disabled={isTitleGenerating || !watchedContent}
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                      >
                                        {isTitleGenerating ? (
                                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 提案中...</>
                                        ) : (
                                          <><Wand2 className="h-4 w-4 mr-2" /> AIに相談</>
                                        )}
                                      </Button>
                                    </div>
                                    <FormControl>
                                      <Input 
                                        placeholder="物語のタイトルを入力..."
                                        className="h-20 text-3xl font-black border-2 focus:ring-primary px-6 rounded-xl shadow-inner bg-muted/5"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    {!watchedContent && (
                                      <p className="text-[10px] text-muted-foreground italic">※本文を入力するとAIがタイトルを提案できます</p>
                                    )}
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
                                        <p className="font-bold text-foreground">画像をアップロード</p>
                                        <p className="text-sm text-muted-foreground">JPG, PNG, WebP (Max 2MB)</p>
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
                                        <Button type="button" variant="destructive" onClick={() => { setImageFile(null); setImagePreview(null); setIsDirty(true); }}>
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
                        </div>
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
                                AI改善
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
                                          "min-h-[700px] h-[75vh] text-xl leading-relaxed font-mono border-0 rounded-none focus-visible:ring-0 resize-none p-10 bg-muted/5",
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
                                "bg-card p-12 overflow-y-auto prose prose-xl dark:prose-invert max-w-none min-h-[700px] h-[75vh]",
                                viewMode === 'split' ? "lg:border-l-0" : ""
                              )}>
                                <MarkdownRenderer content={watchedContent || "*プレビューする内容がありません*"} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-6">
                          <AnimatePresence mode="wait">
                            {aiSuggestion && (aiSuggestion.type === "summary" || aiSuggestion.type === "tags") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <Alert className="border-primary/50 bg-primary/5 mb-6">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <AlertTitle className="font-bold flex items-center justify-between">
                                    AIによる{aiSuggestion.type === "summary" ? "要約" : "タグ"}の提案
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="ghost" onClick={() => setAiSuggestion(null)}>破棄</Button>
                                      <Button size="sm" onClick={applyAiSuggestion}>適用する</Button>
                                    </div>
                                  </AlertTitle>
                                  <AlertDescription className="mt-2">
                                    {aiSuggestion.type === "summary" ? (
                                      <p className="text-sm italic leading-relaxed">{aiSuggestion.content as string}</p>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {(aiSuggestion.content as string[]).map(tag => (
                                          <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">#{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                  </AlertDescription>
                                </Alert>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <Card className="border-border shadow-md">
                            <CardContent className="p-10 space-y-12">
                              <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center justify-between mb-2">
                                      <FormLabel className="text-lg font-bold">要約</FormLabel>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleGenerateSummary}
                                        disabled={isGeneratingSummary || isTagGenerating}
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                      >
                                        {isGeneratingSummary ? (
                                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 生成中...</>
                                        ) : (
                                          <><Wand2 className="h-4 w-4 mr-2" /> AIで生成</>
                                        )}
                                      </Button>
                                    </div>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="物語のあらすじを簡潔にまとめてください..."
                                        className="h-48 text-lg border-2 focus-visible:ring-primary p-6 rounded-xl bg-muted/5 leading-relaxed"
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
                                    <div className="flex items-center justify-between mb-2">
                                      <FormLabel className="text-lg font-bold">タグ</FormLabel>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleGenerateTags}
                                        disabled={isTagGenerating || isGeneratingSummary}
                                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                      >
                                        {isTagGenerating ? (
                                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 提案中...</>
                                        ) : (
                                          <><Tag className="h-4 w-4 mr-2" /> AIで提案</>
                                        )}
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
                        </div>
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
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-12">
                                <h3 className="text-4xl md:text-6xl font-black text-white line-clamp-2 tracking-tight">{watchedTitle}</h3>
                              </div>
                            </div>
                            <CardContent className="p-12 space-y-10">
                              {watchedTags && watchedTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {watchedTags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">#{tag}</span>
                                  ))}
                                </div>
                              )}
                              <p className="text-muted-foreground text-2xl leading-relaxed italic border-l-8 border-primary pl-8 py-2">
                                {watchedSummary || "要約が設定されていません。"}
                              </p>
                              <Separator />
                              <div className="prose prose-2xl dark:prose-invert max-w-none">
                                <MarkdownRenderer content={watchedContent} />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </Form>

              {/* フッターナビゲーション */}
              <div className="flex items-center justify-between pt-16 border-t border-border mt-16">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="lg"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-10 h-14 font-bold"
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
                          disabled={status !== "idle"}
                        >
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            この操作は取り消せません。すべてのデータが永久に削除されます。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={status === "deleting"}>キャンセル</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={async () => {
                              setStatus("deleting")
                              try {
                                const res = await onDelete()
                                if (res.error) {
                                  toast.error(res.error)
                                  setStatus("idle")
                                } else {
                                  toast.success("記事を削除しました")
                                  router.push("/")
                                  router.refresh()
                                }
                              } catch (e) {
                                toast.error("削除中にエラーが発生しました")
                                setStatus("idle")
                              }
                            }}
                            disabled={status === "deleting"}
                          >
                            {status === "deleting" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "削除する"}
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
                      className="px-16 h-14 font-black text-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.02]"
                    >
                      次へ
                      <ChevronRight className="h-6 w-6 ml-2" />
                    </Button>
                  ) : (
                    <div className="flex gap-6">
                      <Button 
                        variant="outline"
                        size="lg" 
                        disabled={status !== "idle" || !watchedTitle || !watchedContent}
                        onClick={() => handleAction(false)}
                        className="px-10 h-14 font-bold border-2"
                      >
                        {status === "saving-draft" ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        下書き保存
                      </Button>
                      <Button 
                        size="lg" 
                        disabled={status !== "idle" || !watchedTitle || !watchedContent}
                        onClick={() => handleAction(true)}
                        className="px-16 h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 font-black text-lg transition-all hover:scale-[1.02]"
                      >
                        {status === "publishing" ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                        {watchedIsPublished ? "更新する" : "公開する"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* AIチャットサイドバー (Desktop) */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 480, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="hidden lg:block border-l border-border h-full overflow-hidden"
              >
                <EditorChat 
                  currentContent={watchedContent} 
                  onApplySuggestion={handleApplyChatSuggestion} 
                />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* AIチャット (Mobile/Tablet) */}
          <Sheet open={isMounted && isChatOpen && window.innerWidth < 1024} onOpenChange={setIsChatOpen}>
            <SheetContent side="right" className="p-0 w-full sm:max-w-md border-l border-border">
              <SheetHeader className="sr-only">
                <SheetTitle>AI共同執筆アシスタント</SheetTitle>
              </SheetHeader>
              <EditorChat 
                currentContent={watchedContent} 
                onApplySuggestion={handleApplyChatSuggestion} 
              />
            </SheetContent>
          </Sheet>
        </div>

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
        
        {status !== "idle" && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
            <div className="flex flex-col items-center space-y-6 text-center max-w-sm px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black tracking-tighter uppercase">
                  {status === "deleting" ? "Deleting" : status === "publishing" ? "Publishing" : "Saving Draft"}
                </p>
                <p className="text-muted-foreground text-sm font-medium">
                  {status === "deleting" 
                    ? "記事を安全に削除しています..."
                    : status === "publishing" 
                      ? "素晴らしい記事を世界中に届けています..." 
                      : "下書きを安全に保存しています..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default BlogEditor
