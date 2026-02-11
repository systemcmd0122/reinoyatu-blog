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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Lock,
  Clock
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
import { formatJST } from "@/utils/date"
import { getCollections, addBlogToCollection, removeBlogFromCollection, getBlogCollections } from "@/actions/collection"
import EditorChat from "./EditorChat"
import SaveStatus from "@/components/settings/SaveStatus"
import RichTextEditor, { RichTextEditorRef } from "./editor/RichTextEditor"
import EditorSettings from "./editor/EditorSettings"
import { usePresence } from "@/hooks/use-realtime"
import { LoadingState } from "@/components/ui/loading-state"


const AICustomizeDialog = dynamic(
  () => import("@/components/blog/AICustomizeDialog"), 
  { ssr: false }
)

interface BlogEditorProps {
  initialData?: BlogType
  mode: "new" | "edit"
  userId: string
  onSubmit: (values: z.infer<typeof BlogSchema> & { base64Image?: string, imageUrl?: string | null }) => Promise<{ error?: string; success?: boolean; id?: string }>
  onDelete?: (id?: string) => Promise<{ error?: string; success?: boolean }>
}

type EditorStatus = "idle" | "saving-draft" | "publishing" | "deleting" | "uploading-image" | "saved" | "unsaved" | "error"

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
  const [userProfile, setUserProfile] = useState<{ name: string; avatar_url: string | null } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client")
        const supabase = createClient()
        const { data } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", userId)
          .single()
        if (data) {
          setUserProfile(data)
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
      }
    }
    fetchProfile()
  }, [userId])

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

  // 自動保存
  useEffect(() => {
    if (!isDirty || status === "saving-draft" || status === "publishing" || viewMode === "preview") {
      return
    }

    const timer = setTimeout(() => {
      if (watchedTitle && watchedContent) {
        handleAction(false, true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isDirty, watchedTitle, watchedContent, status, viewMode])

  const handleAction = async (isPublished: boolean, silent: boolean = false) => {
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

      // imagePreviewがbase64でなく（＝既存のURL）、かつnullでない場合はそれを現在のURLとして渡す
      // imagePreviewがnullの場合は画像が削除されたことを意味する
      const currentImageUrl = (imagePreview && !imagePreview.startsWith('data:')) ? imagePreview : null;

      const res = await onSubmit({ ...values, base64Image, imageUrl: currentImageUrl })

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

      if (!silent) {
        toast.success(isPublished ? "記事を公開しました" : "下書きを保存しました")
      }
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const maxFileSize = 2 * 1024 * 1024
      if (file.size > maxFileSize) {
        setError("画像サイズは2MB以下にしてください")
        toast.error("画像サイズが大きすぎます（最大2MB）")
        return
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError("JPG, PNG, WebP形式のみ対応しています")
        toast.error("対応していないファイル形式です")
        return
      }

      setStatus("uploading-image")

      try {
        setImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
          setStatus("idle")
          toast.success("画像を読み込みました")
        }
        reader.readAsDataURL(file)
        setError("")
        setIsDirty(true)
      } catch (err) {
        setStatus("error")
        toast.error("画像の読み込みに失敗しました")
      }
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

  const applyAiSuggestion = async () => {
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

    // AI編集通知の送信
    if (currentBlogId) {
      const { notifyAIEdit } = await import("@/actions/notification")
      await notifyAIEdit(userId, currentBlogId)
    }

    setAiSuggestion(null);
  };

  const handleApplyChatSuggestion = async (content: string, mode: 'append' | 'replace') => {
    if (mode === 'append') {
      const current = form.getValues("content")
      form.setValue("content", current + "\n\n" + content, { shouldValidate: true })
    } else {
      form.setValue("content", content, { shouldValidate: true })
    }
    
    // AI編集通知の送信
    if (currentBlogId) {
      const { notifyAIEdit } = await import("@/actions/notification")
      await notifyAIEdit(userId, currentBlogId)
    }

    toast.success("AIの提案を本文に反映しました")
  }

  const handleBack = () => {
    if (isDirty) {
      if (confirm("未保存の変更があります。離脱しますか？")) {
        router.back()
      }
    } else {
      router.back()
    }
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
      <Form {...form}>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* スリムで洗練されたヘッダー */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4 z-[var(--z-nav)] shrink-0">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9" aria-label="戻る">
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
                disabled={!watchedTitle || !watchedContent}
                loading={status === "saving-draft"}
                loadingText="保存中..."
              >
                {!status.includes("saving") && <Save className="h-4 w-4 mr-2" />}
                下書き
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    disabled={!watchedTitle || !watchedContent}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-lg shadow-primary/20"
                    loading={status === "publishing"}
                    loadingText={watchedIsPublished ? "更新中..." : "公開中..."}
                  >
                    {!status.includes("publish") && <Upload className="h-4 w-4 mr-2" />}
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
              <div className={cn(
                "mx-auto transition-all duration-300 ease-in-out pt-0 pb-12 px-6",
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
                                userId={userId}
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
                      "bg-background rounded-2xl border border-border shadow-sm overflow-y-auto custom-scrollbar p-6 sm:p-10",
                      viewMode === "split" ? "h-full" : "min-h-[70vh]"
                    )}>
                      {/* Header Info (Synced with BlogDetail) */}
                      <div className="flex items-center gap-3 mb-8">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={userProfile?.avatar_url || "/default.png"} />
                          <AvatarFallback>{userProfile?.name?.[0] || userId.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">
                            @{userProfile?.name || "Author"}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatJST(new Date().toISOString())}に投稿</span>
                            <span className="mx-1">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.ceil((watchedContent?.length || 0) / 400) || 1}分で読めます
                            </span>
                          </div>
                        </div>
                      </div>

                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 text-foreground leading-tight">
                        {watchedTitle || "無題の記事"}
                      </h1>

                      {watchedTags && watchedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                          {watchedTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="px-3 py-1 rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-none shadow-none font-medium">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Summary (Synced with BlogDetail) */}
                      {watchedSummary && (
                        <div className="mb-10 p-6 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <div className="flex items-center gap-2 mb-3 text-primary">
                            <Wand2 className="h-5 w-5" />
                            <span className="font-bold">AIによる要約</span>
                          </div>
                          <p className="text-foreground/80 leading-relaxed text-sm">
                            {watchedSummary}
                          </p>
                        </div>
                      )}

                      {/* Cover Image (Synced with BlogDetail) */}
                      {imagePreview && (
                        <div className="mb-10 relative aspect-video rounded-xl overflow-hidden border border-border">
                          <Image
                            src={imagePreview}
                            alt="Cover"
                            fill
                            className="object-cover"
                            priority
                          />
                        </div>
                      )}

                      <MarkdownRenderer content={watchedContent || "*プレビューする内容がありません*"} />
                    </div>
                  )}
                </div>
              </div>
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
                    <EditorSettings
                      userId={userId}
                      watchedContent={watchedContent}
                      watchedSummary={watchedSummary}
                      watchedTags={watchedTags}
                      aiSuggestion={aiSuggestion}
                      setAiSuggestion={setAiSuggestion}
                      isTitleGenerating={isTitleGenerating}
                      handleGenerateTitles={handleGenerateTitles}
                      isGeneratingSummary={isGeneratingSummary}
                      handleGenerateSummary={handleGenerateSummary}
                      isTagGenerating={isTagGenerating}
                      handleGenerateTags={handleGenerateTags}
                      applyAiSuggestion={applyAiSuggestion}
                      imagePreview={imagePreview}
                      handleImageUpload={handleImageUpload}
                      setImageFile={setImageFile}
                      setImagePreview={setImagePreview}
                      userCollections={userCollections}
                      setUserCollections={setUserCollections}
                      selectedCollections={selectedCollections}
                      setSelectedCollections={setSelectedCollections}
                      setIsDirty={setIsDirty}
                    />
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
                    <EditorSettings
                      userId={userId}
                      watchedContent={watchedContent}
                      watchedSummary={watchedSummary}
                      watchedTags={watchedTags}
                      aiSuggestion={aiSuggestion}
                      setAiSuggestion={setAiSuggestion}
                      isTitleGenerating={isTitleGenerating}
                      handleGenerateTitles={handleGenerateTitles}
                      isGeneratingSummary={isGeneratingSummary}
                      handleGenerateSummary={handleGenerateSummary}
                      isTagGenerating={isTagGenerating}
                      handleGenerateTags={handleGenerateTags}
                      applyAiSuggestion={applyAiSuggestion}
                      imagePreview={imagePreview}
                      handleImageUpload={handleImageUpload}
                      setImageFile={setImageFile}
                      setImagePreview={setImagePreview}
                      userCollections={userCollections}
                      setUserCollections={setUserCollections}
                      selectedCollections={selectedCollections}
                      setSelectedCollections={setSelectedCollections}
                      setIsDirty={setIsDirty}
                    />
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
          <LoadingState
            message="Deleting article..."
            description="サーバーから記事を完全に削除しています"
          />
        )}

        {status === "uploading-image" && (
          <LoadingState
            message="Processing Image..."
            description="画像を最適化してプレビューを生成しています"
          />
        )}
      </div>
      </Form>
    </TooltipProvider>
  )
}

export default BlogEditor
