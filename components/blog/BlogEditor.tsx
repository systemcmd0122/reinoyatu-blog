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
import SaveStatus from "@/components/settings/SaveStatus"
import RichTextEditor, { RichTextEditorRef } from "./editor/RichTextEditor"
import EditorSettings from "./editor/EditorSettings"
import { usePresence } from "@/hooks/use-realtime"
import { LoadingState } from "@/components/ui/loading-state"
import { useMediaQuery } from "@/hooks/use-media-query"


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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const isMobile = useMediaQuery("(max-width: 767px)")
  const editorRef = useRef<RichTextEditorRef>(null)
  const isSaving = useRef(false)
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
  // userStatusをmemo化して無限ループを防止
  const userStatus = React.useMemo(() => ({
    userId,
    blogId: currentBlogId,
    lastActive: new Date().toISOString()
  }), [userId, currentBlogId])

  const presenceState = usePresence(`blog-editor-${currentBlogId || 'new'}`, userStatus)

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
  
  const form = useForm<z.infer<typeof BlogSchema>>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      content_json: initialData?.content_json || "",
      summary: initialData?.summary || "",
      tags: initialData?.tags?.map(t => t.name) || [],
      is_published: initialData?.is_published || false,
      coauthors: initialData?.article_authors?.filter(aa => aa?.role === 'editor').map(aa => aa.user_id) || [],
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
        handleAction(!!watchedIsPublished, true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isDirty, watchedTitle, watchedContent, status, viewMode, watchedIsPublished])

  const handleAction = async (isPublished: boolean, silent: boolean = false) => {
    if (isSaving.current) return
    
    setError("")
    setStatus(isPublished ? "publishing" : "saving-draft")
    isSaving.current = true

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
        // フィールドエラーがある場合はセットする（Zodバリデーション結果の反映など）
        if (typeof res.error === 'string' && res.error.includes('タイトル')) {
           form.setError("title", { message: res.error });
        } else if (typeof res.error === 'string' && res.error.includes('内容')) {
           form.setError("content", { message: res.error });
        }

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

      if (isPublished && !silent) {
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
    } finally {
      isSaving.current = false
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
        <header className={cn(
          "border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-2 md:px-4 z-[var(--z-nav)] shrink-0 transition-all duration-300",
          (isEditorFocused && isMobile) ? "h-0 opacity-0 -translate-y-full overflow-hidden" : "h-14 md:h-16 opacity-100 translate-y-0"
        )}>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9" aria-label="戻る">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
              <div className="hidden sm:flex items-center gap-2 mb-1">
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
                <span className="text-sm font-bold truncate max-w-[80px] sm:max-w-[200px] md:max-w-[400px]">
                  {watchedTitle || "無題"}
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
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm" 
                className="font-bold hidden sm:flex"
                onClick={() => handleAction(false)}
                disabled={!watchedTitle || !watchedContent}
                loading={status === "saving-draft"}
                loadingText="保存中..."
              >
                {!status.includes("saving") && <Save className="h-4 w-4 mr-2" />}
                下書き保存
              </Button>

              <Button
                size="sm"
                disabled={!watchedTitle || !watchedContent}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-full px-6"
                onClick={() => setIsSidebarOpen(true)}
              >
                公開設定
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="メニューを開く">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>アクション</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setViewMode(viewMode === "preview" ? "edit" : "preview")}>
                    {viewMode === "preview" ? <Type className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {viewMode === "preview" ? "エディタに戻る" : "プレビューを表示"}
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

            </div>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <div className="flex-1 flex overflow-hidden bg-background">
          <main className="flex-1 overflow-y-auto relative custom-scrollbar">
              <div className={cn(
                "mx-auto transition-all duration-300 ease-in-out pt-0 pb-32 px-4 md:px-6 max-w-3xl",
              )}>
                <div className="flex flex-col">
                  {/* エディタエリア */}
                  {viewMode === "edit" && (
                    <div className="space-y-6 flex flex-col pt-8">
                      {/* 見出し画像設定 (note風) */}
                      <div className="group relative aspect-[21/9] w-full rounded-xl overflow-hidden border-2 border-dashed border-muted hover:border-primary/50 transition-all cursor-pointer bg-muted/10 mb-8">
                        {imagePreview ? (
                          <>
                            <Image src={imagePreview} alt="Cover" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => document.getElementById('main-image-upload')?.click()}>
                                <Upload className="h-3 w-3 mr-1" />
                                変更
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setImageFile(null); setImagePreview(null); setIsDirty(true); }}>
                                削除
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <label htmlFor="main-image-upload" className="flex flex-col items-center cursor-pointer group/label">
                              <ImagePlus className="h-10 w-10 text-muted-foreground mb-2 group-hover/label:text-primary transition-colors" />
                              <p className="text-sm font-bold text-muted-foreground group-hover/label:text-primary transition-colors">見出し画像を追加</p>
                            </label>
                            <p className="text-[10px] text-muted-foreground/60 mt-2">推奨サイズ: 1280 × 670px</p>
                          </div>
                        )}
                        <input id="main-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </div>

                      {/* タイトル入力 */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input 
                                placeholder="タイトル"
                                className="h-auto py-2 text-4xl md:text-5xl font-bold border-none bg-transparent focus-visible:ring-0 px-0 shadow-none placeholder:text-muted-foreground/20 tracking-tight"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4 opacity-50" />

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
                                onFocus={() => setIsEditorFocused(true)}
                                onBlur={() => setIsEditorFocused(false)}
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
                  {viewMode === "preview" && (
                    <div className={cn(
                      "bg-background overflow-y-auto custom-scrollbar pt-8",
                    )}>
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

                      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 text-foreground leading-tight">
                        {watchedTitle || "無題の記事"}
                      </h1>

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
                            <span>{isMounted ? formatJST(new Date().toISOString()) : ""}に投稿</span>
                            <span className="mx-1">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.ceil((watchedContent?.length || 0) / 400) || 1}分で読めます
                            </span>
                          </div>
                        </div>
                      </div>

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
                            <FileText className="h-5 w-5" />
                            <span className="font-bold">要約</span>
                          </div>
                          <p className="text-foreground/80 leading-relaxed text-sm">
                            {watchedSummary}
                          </p>
                        </div>
                      )}


                      <MarkdownRenderer content={watchedContent || "*プレビューする内容がありません*"} />
                    </div>
                  )}
                </div>
              </div>
          </main>

          {/* 公開設定パネル (note風) */}
          <Sheet open={isMounted && isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="right" className="p-0 w-full sm:max-w-md border-l border-border flex flex-col">
              <SheetHeader className="p-6 border-b border-border shrink-0">
                <SheetTitle className="text-xl font-bold">公開設定</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-10">
                  <EditorSettings
                    userId={userId}
                    watchedContent={watchedContent}
                    watchedSummary={watchedSummary}
                    watchedTags={watchedTags}
                    imagePreview={imagePreview}
                    handleImageUpload={handleImageUpload}
                    setImageFile={setImageFile}
                    setImagePreview={setImagePreview}
                    userCollections={userCollections}
                    setUserCollections={setUserCollections}
                    selectedCollections={selectedCollections}
                    setSelectedCollections={setSelectedCollections}
                    setIsDirty={setIsDirty}
                    initialCoAuthors={initialData?.article_authors?.filter(aa => aa?.role === 'editor' && aa?.profiles).map(aa => ({
                      id: aa.profiles!.id,
                      name: aa.profiles!.name,
                      avatar_url: aa.profiles!.avatar_url
                    }))}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold">公開の確認</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {watchedIsPublished
                        ? "記事を更新すると、変更内容が即座に反映されます。"
                        : "「投稿する」ボタンを押すと、記事が公開されます。公開後もいつでも編集可能です。"}
                    </p>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 rounded-full text-base"
                      onClick={() => handleAction(true)}
                      loading={status === "publishing"}
                    >
                      {watchedIsPublished ? "更新する" : "投稿する"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        
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
