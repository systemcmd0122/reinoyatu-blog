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
import { Badge } from "@/components/ui/badge"
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
  Save, 
  CheckCircle2, 
  AlertCircle,
  Layout,
  Columns,
  MessageSquare,
  Sparkles,
  Settings,
  MoreVertical,
  Trash2,
  ExternalLink,
  PanelRight,
  Monitor,
  Smartphone,
  Type,
  Layers,
  Lock
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
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import TagInput from "@/components/ui/TagInput"
import { Checkbox } from "@/components/ui/checkbox"
import CollectionDialog from "@/components/collection/CollectionDialog"
import { BlogType, CollectionType } from "@/types"
import MarkdownRenderer from "./markdown/MarkdownRenderer"
import { format } from "date-fns"
import { getCollections, addBlogToCollection, removeBlogFromCollection, getBlogCollections } from "@/actions/collection"
import EditorChat from "./EditorChat"
import SaveStatus from "@/components/settings/SaveStatus"
import RichTextEditor, { RichTextEditorRef } from "./editor/RichTextEditor"
import { usePresence } from "@/hooks/use-realtime"


const AICustomizeDialog = dynamic(
  () => import("@/components/blog/AICustomizeDialog"), 
  { ssr: false }
)

interface BlogEditorProps {
  initialData?: BlogType
  mode: "new" | "edit"
  userId: string
  onSubmit: (values: z.infer<typeof BlogSchema> & { base64Image?: string }) => Promise<{ error?: string; success?: boolean; id?: string }>
  onDelete?: (id?: string) => Promise<{ error?: string; success?: boolean }>
}

type EditorStatus = "idle" | "saving-draft" | "publishing" | "deleting" | "saved" | "unsaved" | "error"

const BlogEditor: React.FC<BlogEditorProps> = ({ 
  initialData, 
  mode, 
  userId, 
  onSubmit,
  onDelete
}) => {
  const router = useRouter()
  const [internalMode, setInternalMode] = useState<"new" | "edit">(mode)
  const [currentBlogId, setCurrentBlogId] = useState<string | undefined>(initialData?.id)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<EditorStatus>("idle")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData?.updated_at ? new Date(initialData.updated_at) : null)
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState("settings")
  const [isMounted, setIsMounted] = useState(false)
  const editorRef = useRef<RichTextEditorRef>(null)
  const [userCollections, setUserCollections] = useState<CollectionType[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  // プレゼンスによる他ユーザーの編集状況の追跡
  const presenceState = usePresence(`blog-editor-${currentBlogId || 'new'}`, {
    userId,
    blogId: currentBlogId,
    lastActive: new Date().toISOString()
  })

  const otherEditors = Object.values(presenceState)
    .flat()
    .filter((p: any) => p.userId !== userId)

  useEffect(() => {
    setIsMounted(true)
    const fetchCollections = async () => {
      const collections = await getCollections(userId)
      setUserCollections(collections)
    }
    fetchCollections()

    if (initialData?.id) {
      const fetchBlogCollections = async () => {
        const collections = await getBlogCollections(initialData.id)
        setSelectedCollections(collections.map(c => c.id))
      }
      fetchBlogCollections()
    }
  }, [userId, initialData?.id])
  
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
      content_json: initialData?.content_json || "",
      summary: initialData?.summary || "",
      tags: initialData?.tags?.map(t => t.name) || [],
      is_published: initialData?.is_published || false,
    },
  })

  // フォームの変更を監視
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(true)
      if (status === "saved") setStatus("unsaved")
    })
    return () => subscription.unsubscribe()
  }, [form, status])

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

  const handleAction = async (isPublished: boolean) => {
    if (status === "saving-draft" || status === "publishing") return
    
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
          setStatus("error")
          return
        }
      }

      form.setValue("is_published", isPublished)
      const values = form.getValues()

      const res = await onSubmit({ ...values, base64Image })

      if (res?.error) {
        setError(`送信に失敗しました: ${res.error}`)
        setStatus("error")
        toast.error(res.error)
        return
      }

      // コレクションへの追加・削除
      if (res.id || currentBlogId) {
        const blogId = res.id || currentBlogId!
        const initialCollections = initialData?.id ? (await getBlogCollections(initialData.id)).map(c => c.id) : []
        
        const toAdd = selectedCollections.filter(id => !initialCollections.includes(id))
        const toRemove = initialCollections.filter(id => !selectedCollections.includes(id))

        await Promise.all([
          ...toAdd.map(id => addBlogToCollection(id, blogId)),
          ...toRemove.map(id => removeBlogFromCollection(id, blogId))
        ])
      }

      toast.success(isPublished ? "記事を公開しました" : "下書きを保存しました")
      setIsDirty(false)
      setLastSaved(new Date())
      setStatus("saved")

      // 新規作成から編集モードへの内部状態移行
      if (internalMode === "new" && res.id) {
        setInternalMode("edit")
        setCurrentBlogId(res.id)
        // URLを静かに更新（履歴を置き換え）
        window.history.replaceState(null, "", `/blog/${res.id}/edit`)
      }

      if (isPublished) {
        // 公開時はトップへ（これはユーザーの意図した明示的なアクション後の遷移）
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 1500)
      }

    } catch (error) {
      console.error("Submission error:", error)
      setError("ネットワークエラーが発生しました。")
      setStatus("error")
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
    const editor = editorRef.current?.getEditor()
    if (!editor) return
    editor.chain().focus().toggleCodeBlock({ language }).run()
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

  const getSaveStatus = () => {
    if (status === "publishing") return "saving"
    if (status === "saving-draft") return "saving"
    if (status === "error") return "unsaved"
    if (status === "saved") return "saved"
    if (isDirty) return "unsaved"
    return "saved"
  }

  useEffect(() => {
    // エディタ表示中はボディのスクロールを抑制し、二重スクロールを防ぐ
    document.body.classList.add("overflow-hidden")
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* スリムで洗練されたヘッダー */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4 z-[var(--z-nav)] shrink-0">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9" aria-label="戻る">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">
                  {internalMode === "new" ? "New Story" : "Edit Story"}
                </span>
                {internalMode === "edit" && (
                  <Badge variant="outline" className={cn(
                    "text-[8px] h-3.5 px-1 font-bold border-none uppercase tracking-tighter",
                    watchedIsPublished ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {watchedIsPublished ? "Published" : "Draft"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold truncate max-w-[100px] sm:max-w-[200px] md:max-w-[400px]">
                  {watchedTitle || "無題の記事"}
                </span>
                <SaveStatus status={getSaveStatus() as any} />
                
                {/* 他の編集者を表示 */}
                {otherEditors.length > 0 && (
                  <div className="flex -space-x-2 ml-2">
                    {otherEditors.map((p: any, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div className="w-6 h-6 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[8px] font-bold overflow-hidden ring-2 ring-primary/20">
                             {idx + 1}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>他のユーザーが編集中です</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center bg-muted/50 rounded-lg p-1 border border-border">
              <Button 
                variant={viewMode === "edit" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("edit")}
                className="h-8 gap-2"
              >
                <Type className="h-4 w-4" />
                執筆
              </Button>
              <Button 
                variant={viewMode === "split" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("split")}
                className="h-8 gap-2"
              >
                <Columns className="h-4 w-4" />
                分割
              </Button>
              <Button 
                variant={viewMode === "preview" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("preview")}
                className="h-8 gap-2"
              >
                <Eye className="h-4 w-4" />
                確認
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 hidden md:block" />

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold hidden sm:flex border-2"
                onClick={() => handleAction(false)}
                disabled={status === "saving-draft" || status === "publishing" || !watchedTitle || !watchedContent}
              >
                {status === "saving-draft" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                下書き
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    disabled={status === "saving-draft" || status === "publishing" || !watchedTitle || !watchedContent}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-lg shadow-primary/20"
                  >
                    {status === "publishing" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {watchedIsPublished ? "更新" : "公開"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{watchedIsPublished ? "記事を更新しますか？" : "記事を公開しますか？"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {watchedIsPublished 
                        ? "変更内容は即座に公開中の記事に反映されます。" 
                        : "この記事を世界中に向けて公開します。公開後もいつでも編集可能です。"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAction(true)} className="font-bold">
                      {watchedIsPublished ? "更新する" : "今すぐ公開する"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="メニューを開く">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>アクション</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setViewMode("preview")}>
                    <Eye className="h-4 w-4 mr-2" /> プレビュー表示
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAIDialogOpen(true)}>
                    <Sparkles className="h-4 w-4 mr-2" /> AIで文章改善
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {internalMode === "edit" && onDelete && (
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={async () => {
                        if (confirm("本当に削除しますか？")) {
                          setStatus("deleting")
                          const res = await onDelete(currentBlogId)
                          if (res.success) {
                            toast.success("記事を削除しました")
                            router.push("/")
                            router.refresh()
                          } else {
                            setStatus("idle")
                            toast.error(res.error || "削除に失敗しました")
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> 記事を削除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-9 w-9", isSidebarOpen && "bg-muted")}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="サイドバーを切り替える"
              >
                <PanelRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <div className="flex-1 flex overflow-hidden bg-muted/5">
          <main className="flex-1 overflow-y-auto relative custom-scrollbar">
            <Form {...form}>
              <div className={cn(
                "mx-auto transition-all duration-300 ease-in-out py-12 px-6",
                viewMode === "split" ? "max-w-none" : "max-w-screen-xl"
              )}>
                <div className={cn(
                  "grid gap-8",
                  viewMode === "split" ? "grid-cols-2 h-[calc(100vh-160px)]" : "grid-cols-1"
                )}>
                  {/* エディタエリア */}
                  {(viewMode === "edit" || viewMode === "split") && (
                    <div className={cn(
                      "space-y-8 flex flex-col",
                      viewMode === "split" && "overflow-hidden"
                    )}>
                      {/* タイトル入力 */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input 
                                placeholder="タイトルを入力..."
                                className="h-20 text-4xl md:text-5xl font-black border-none bg-transparent focus-visible:ring-0 px-0 shadow-none placeholder:text-muted-foreground/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 本文入力 */}
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1 flex flex-col space-y-0">
                            <FormControl className="flex-1">
                              <RichTextEditor
                                ref={editorRef}
                                content={field.value}
                                initialJson={form.getValues("content_json")}
                                onChange={(markdown, json) => {
                                  field.onChange(markdown);
                                  if (json) form.setValue("content_json", json);
                                }}
                                placeholder="ここから物語を始めましょう..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* プレビューエリア */}
                  {(viewMode === "preview" || viewMode === "split") && (
                    <div className={cn(
                      "bg-background rounded-2xl border border-border shadow-sm overflow-y-auto custom-scrollbar p-8 md:p-12 prose prose-xl dark:prose-invert max-w-none",
                      viewMode === "split" ? "h-full" : "min-h-[70vh]"
                    )}>
                      <h1 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                        {watchedTitle || "無題の記事"}
                      </h1>
                      <MarkdownRenderer content={watchedContent || "*プレビューする内容がありません*"} />
                    </div>
                  )}
                </div>
              </div>
            </Form>
          </main>

          {/* 右サイドバー (Desktop) */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 440, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:flex flex-col border-l border-border bg-background z-[var(--z-sticky)] overflow-hidden"
              >
                <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                    <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-muted/50 border border-border rounded-lg">
                      <TabsTrigger value="settings" className="text-xs font-bold gap-2">
                        <Settings className="h-3.5 w-3.5" />
                        設定
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="text-xs font-bold gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="settings" className="m-0 flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* タイトル提案 */}
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Type className="h-4 w-4" />
                            タイトル提案
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleGenerateTitles}
                            disabled={isTitleGenerating || !watchedContent}
                            className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
                          >
                            {isTitleGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                            AI提案
                          </Button>
                        </div>

                        {aiSuggestion?.type === "titles" && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3"
                          >
                            <p className="text-xs text-primary font-bold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              タイトル案:
                            </p>
                            <div className="space-y-2">
                              {(aiSuggestion.content as string[]).map((title, i) => (
                                <div key={i} className="flex items-center justify-between group/title">
                                  <p className="text-xs font-medium leading-tight pr-2">{title}</p>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 px-2 text-[9px] font-bold shrink-0 opacity-0 group-hover/title:opacity-100 transition-opacity"
                                    onClick={() => {
                                      form.setValue("title", title, { shouldValidate: true })
                                      toast.success("タイトルを適用しました")
                                      setAiSuggestion(null)
                                    }}
                                  >
                                    適用
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 w-full text-[9px] font-bold mt-2" onClick={() => setAiSuggestion(null)}>
                              閉じる
                            </Button>
                          </motion.div>
                        )}
                        <p className="text-[10px] text-muted-foreground italic px-1">本文の内容に基づいて魅力的なタイトルを提案します。</p>
                      </section>

                    {/* カバー画像設定 */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ImagePlus className="h-4 w-4" />
                          カバー画像
                        </h4>
                      </div>
                      <div className="group relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-muted hover:border-primary/50 transition-all cursor-pointer bg-muted/20">
                        {imagePreview ? (
                          <>
                            <Image src={imagePreview} alt="Cover" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => document.getElementById('sidebar-image-upload')?.click()}>
                                変更
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                                削除
                              </Button>
                            </div>
                          </>
                        ) : (
                          <label htmlFor="sidebar-image-upload" className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                            <p className="text-xs font-bold text-muted-foreground group-hover:text-primary">画像をアップロード</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">2MB以内の JPG, PNG, WebP</p>
                          </label>
                        )}
                        <input id="sidebar-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </div>
                    </section>

                    {/* 要約設定 */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          要約 (Summary)
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary || !watchedContent}
                          className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
                        >
                          {isGeneratingSummary ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                          AI生成
                        </Button>
                      </div>

                        {aiSuggestion?.type === "summary" && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3"
                          >
                            <p className="text-xs text-primary font-bold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AIによる要約案:
                            </p>
                            <p className="text-xs leading-relaxed">{aiSuggestion.content as string}</p>
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-[10px] font-bold" onClick={applyAiSuggestion}>
                                適用する
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => setAiSuggestion(null)}>
                                破棄
                              </Button>
                            </div>
                          </motion.div>
                        )}

                      <Textarea 
                        value={watchedSummary}
                        onChange={(e) => form.setValue("summary", e.target.value)}
                          placeholder="記事の概要を簡潔に入力してください..."
                        className="min-h-[120px] text-sm bg-muted/20 border-border focus-visible:ring-primary leading-relaxed rounded-xl p-4"
                      />
                    </section>

                    {/* コレクション設定 */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          シリーズに追加
                        </h4>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {userCollections.length > 0 ? (
                          userCollections.map(collection => (
                            <div key={collection.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`col-${collection.id}`} 
                                checked={selectedCollections.includes(collection.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCollections([...selectedCollections, collection.id])
                                  } else {
                                    setSelectedCollections(selectedCollections.filter(id => id !== collection.id))
                                  }
                                  setIsDirty(true)
                                }}
                              />
                              <label 
                                htmlFor={`col-${collection.id}`}
                                className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                              >
                                {collection.title}
                                {!collection.is_public && <Lock className="h-3 w-3 text-amber-500" />}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">コレクションがありません。</p>
                        )}
                      </div>
                      <CollectionDialog 
                        userId={userId} 
                        onSuccess={(newCol: any) => {
                          setUserCollections([newCol, ...userCollections])
                        }}
                      />
                    </section>

                    {/* タグ設定 */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          タグ
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleGenerateTags}
                          disabled={isTagGenerating || !watchedContent}
                          className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
                        >
                          {isTagGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                          AI提案
                        </Button>
                      </div>

                        {aiSuggestion?.type === "tags" && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3"
                          >
                            <p className="text-xs text-primary font-bold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              おすすめのタグ:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(aiSuggestion.content as string[]).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-[10px] font-bold" onClick={applyAiSuggestion}>
                                全て追加
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => setAiSuggestion(null)}>
                                破棄
                              </Button>
                            </div>
                          </motion.div>
                        )}

                      <TagInput 
                        value={watchedTags || []}
                        onChange={(tags) => form.setValue("tags", tags)}
                        placeholder="タグを追加..."
                        className="bg-muted/20 border-border rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground italic px-1">最大10個まで。Enterで確定。</p>
                    </section>
                  </TabsContent>

                  <TabsContent value="ai" className="m-0 flex-1 h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <EditorChat 
                      currentContent={watchedContent} 
                      onApplySuggestion={handleApplyChatSuggestion} 
                    />
                  </TabsContent>
                </Tabs>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* AI/設定用 Sheet (Mobile/Tablet) */}
          <Sheet open={isMounted && isSidebarOpen && window.innerWidth < 1024} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="right" className="p-0 w-full sm:max-w-md border-l border-border flex flex-col">
              <SheetHeader className="p-4 border-b border-border shrink-0">
                <SheetTitle className="text-left font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  補助パネル
                </SheetTitle>
              </SheetHeader>
              <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-border bg-muted/20">
                  <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted/50 border border-border rounded-lg">
                    <TabsTrigger value="settings" className="font-bold text-xs gap-2">
                      <Settings className="h-4 w-4" />
                      記事設定
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="font-bold text-xs gap-2">
                      <MessageSquare className="h-4 w-4" />
                      AIアシスト
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="settings" className="m-0 p-6 space-y-8">
                     {/* Mobile Settings (Duplicate logic for now or refactor to sub-component) */}
                     <section className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ImagePlus className="h-4 w-4" />
                          カバー画像
                        </h4>
                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-muted bg-muted/20">
                          {imagePreview ? (
                            <Image src={imagePreview} alt="Cover" fill className="object-cover" />
                          ) : (
                            <label htmlFor="mobile-image-upload" className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-xs font-bold text-muted-foreground">画像をアップロード</p>
                            </label>
                          )}
                          <input id="mobile-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          要約
                        </h4>
                        <Textarea 
                          value={watchedSummary}
                          onChange={(e) => form.setValue("summary", e.target.value)}
                          className="min-h-[120px] bg-muted/20 border-border rounded-xl"
                        />
                      </section>

                      <section className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          タグ
                        </h4>
                        <TagInput 
                          value={watchedTags || []}
                          onChange={(tags) => form.setValue("tags", tags)}
                          className="bg-muted/20 border-border rounded-xl"
                        />
                      </section>
                  </TabsContent>
                  <TabsContent value="ai" className="m-0 h-full">
                    <EditorChat 
                      currentContent={watchedContent} 
                      onApplySuggestion={handleApplyChatSuggestion} 
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>

        {/* AI改善ダイアログ */}
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
        
        {/* 全面ローディング (削除中など) */}
        {status === "deleting" && (
          <div className="fixed inset-0 z-[var(--z-overlay)] bg-background/90 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-destructive" />
              <p className="text-lg font-black tracking-tighter uppercase">Deleting article...</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default BlogEditor
