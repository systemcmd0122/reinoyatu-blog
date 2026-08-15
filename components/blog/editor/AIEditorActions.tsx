"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useWebLLM, WEBLLM_MODEL_INFO } from "@/hooks/use-webllm"
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm"
import { searchWeb } from "@/actions/search"
import { getAiSettings } from "@/actions/user"
import { Progress } from "@/components/ui/progress"
import {
  Sparkles,
  Search,
  Loader2,
  Check,
  RefreshCw,
  Type,
  Tag as TagIcon,
  FileText,
  AlertCircle,
  Plus,
  ArrowRight,
  Wand2,
  X,
  Cpu,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AILiveStatus } from "@/components/blog/ai/AILiveStatus"
import { GPUInfoLine } from "@/components/blog/ai/GPUInfoLine"

import { cn } from "@/lib/utils"

interface AIEditorActionsProps {
  title: string
  content: string
  tags: string[]
  onUpdateTitle: (title: string) => void
  onUpdateContent: (content: string) => void
  onUpdateTags: (tags: string[]) => void
  onUpdateSummary: (summary: string) => void
}

export const AIEditorActions: React.FC<AIEditorActionsProps> = ({
  title,
  content,
  tags,
  onUpdateTitle,
  onUpdateContent,
  onUpdateTags,
  onUpdateSummary
}) => {
  const webllm = useWebLLM()
  const isGenerating = webllm.status === "generating"
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<string | null>(null)
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [activeAction, setActiveAction] = useState<"improve" | "title" | "tags" | "summary" | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [aiSettings, setAiSettings] = useState<{ persona?: string, instructions?: string, writingStyle?: string }>({})
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getAiSettings()
        if (res.success) {
          setAiSettings(res.data)
        }
      } catch (err) {
        console.error("Failed to fetch AI settings:", err)
      }
    }
    fetchSettings()
  }, [])

  // WebGPU 対応端末ではマウント時にモデルをバックグラウンドでロード
  useEffect(() => {
    if (webllm.webgpuSupport !== "supported") return
    if (webllm.status !== "idle") return
    webllm.loadModel().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webllm.webgpuSupport])

  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])

  // ── 検索 ──────────────────────────────────────

  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) {
      toast.error("検索キーワードを入力してください。")
      searchInputRef.current?.focus()
      return
    }
    setIsSearching(true)
    try {
      const result = await searchWeb(q)
      if (result.error) {
        toast.error(result.error)
      } else {
        setSearchResults(result.content)
        toast.success("最新情報を取得しました。AIのアクションに反映されます。")
      }
    } catch (err) {
      toast.error("検索中に予期しないエラーが発生しました。")
    } finally {
      setIsSearching(false)
    }
  }

  const handleFillQueryFromTitle = () => {
    if (!title) return
    setSearchQuery(title)
    searchInputRef.current?.focus()
  }

  // ── 警告チェック ──
  const withAiWarning = (action: () => void) => {
    if (typeof window !== "undefined") {
      const ackAi = localStorage.getItem("ack_ai_demo_v1")
      if (!ackAi) {
        setPendingAction(() => action)
        setShowWarning(true)
        return
      }
    }
    action()
  }

  const handleAcceptAiWarning = () => {
    localStorage.setItem("ack_ai_demo_v1", "true")
    setShowWarning(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  // ── AI アクション ────────────────────────────

  const runGenerate = async (
    action: "improve" | "title" | "tags" | "summary",
    system: string,
    user: string,
    maxTokens: number
  ): Promise<string> => {
    setActiveAction(action)
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ]
    try {
      return await webllm.generate(messages, { temperature: 0.7, maxTokens })
    } catch (err) {
      throw err
    } finally {
      setActiveAction(null)
    }
  }

  const handleImproveContent = async () => {
    if (!content) return
    const systemPrompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : "あなたはプロの編集者です。"}
以下のブログ記事を、読者の興味を惹きつける、洗練された自然な日本語の文章にブラッシュアップしてください。
構成は維持しつつ、表現をより豊かに、専門用語は分かりやすく説明を加えてください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}
${aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : ""}

重要:
- 出力は改善後のMarkdown形式の本文のみとし、前置きや解説は一切不要です。
- 「*」や「#」などの装飾を過剰に使わず、読みやすさを最優先してください。
- 検索結果が提供されている場合は、その事実を自然に本文に組み込んでください。`

    const userPrompt = `
${searchResults ? `以下の最新情報を内容に取り入れてください:\n${searchResults}\n\n` : ""}

記事タイトル: ${title}
記事内容:
${content}`

    try {
      const improved = await runGenerate("improve", systemPrompt, userPrompt, 1024)
      const cleanImproved = improved
        .replace(/^```markdown\n/, "")
        .replace(/^```\n?/, "")
        .replace(/\n```$/, "")
        .trim()
      onUpdateContent(cleanImproved)
      toast.success("記事を改善しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AIによる改善に失敗しました。")
    }
  }

  const handleSuggestTitle = async () => {
    if (!content) return
    const systemPrompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : ""}
以下の記事の内容に最もふさわしい、読者がクリックしたくなるような魅力的なタイトルを日本語で5つ提案してください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}
${aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : ""}

重要:
- 1行に1つずつタイトルのみを出力してください。
- 「*」や「提案1：」などの記号・接頭辞、番号、Markdown装飾は一切不要です。`

    const userPrompt = `
${searchResults ? `検索文脈:\n${searchResults}\n\n` : ""}

記事内容:
${content.substring(0, 2000)}`

    try {
      const suggestions = await runGenerate("title", systemPrompt, userPrompt, 512)
      const titles = suggestions
        .split("\n")
        .map(t => t.replace(/^[0-9一二三四五].?[\s.．:：、]/, "").replace(/[*#]/g, "").trim())
        .filter(t => t.length > 0)
        .slice(0, 5)
      setSuggestedTitles(titles)
      toast.success("タイトル候補を生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "タイトル提案に失敗しました。")
    }
  }

  const handleGenerateTags = async () => {
    if (!content) return
    const systemPrompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : ""}
以下の記事に関連する、検索されやすい重要なキーワード（タグ）を5つから8つ程度抽出してください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}

重要:
- カンマ区切りで「単語」のみを出力してください。
- 文章や説明、Markdown装飾（*など）は一切不要です。
- 1つ1つのタグは短く、適切な固有名詞や一般名詞にしてください。`

    const userPrompt = `
${searchResults ? `検索文脈:\n${searchResults}\n\n` : ""}

タイトル: ${title}
記事内容:
${content.substring(0, 1500)}`

    try {
      const tagsText = await runGenerate("tags", systemPrompt, userPrompt, 256)
      const newTags = tagsText
        .split(/[,、\n]/)
        .map(t => t.replace(/[*#]/g, "").trim())
        .filter(t => t.length > 0 && t.length < 20)
        .slice(0, 10)
      setSuggestedTags(newTags)
      toast.success("タグ候補を生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "タグ生成に失敗しました。")
    }
  }

  const handleGenerateSummary = async () => {
    if (!content) return
    const systemPrompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : ""}
以下のブログ記事を、300文字程度の丁寧な日本語で要約してください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}
${aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : ""}

重要:
- 要約のテキストのみを出力してください。「要約:」などの接頭辞は不要です。
- Markdown装飾（*、#など）は使用しないでください。`

    const userPrompt = `
${searchResults ? `検索文脈:\n${searchResults}\n\n` : ""}

記事内容:
${content}`

    try {
      const summary = await runGenerate("summary", systemPrompt, userPrompt, 512)
      const cleanSummary = summary.replace(/^要約[：:]\s*/, "").replace(/[*#]/g, "").trim()
      onUpdateSummary(cleanSummary)
      toast.success("要約を生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "要約作成に失敗しました。")
    }
  }

  const handleAddAllTags = () => {
    const newOnes = suggestedTags.filter(t => !tags.includes(t))
    if (newOnes.length === 0) {
      toast.info("追加できる新しいタグはありません。")
      return
    }
    onUpdateTags([...tags, ...newOnes])
    setSuggestedTags([])
    toast.success(`${newOnes.length}件のタグを追加しました。`)
  }

  // ── ローディング / エラー状態 ─────────────────

  if (webllm.webgpuSupport === "checking") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            WebGPU の対応状況を確認中...
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            ブラウザの機能を確認しています。
          </p>
        </CardContent>
      </Card>
    )
  }

  if (webllm.webgpuSupport === "unsupported") {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm font-bold text-amber-600">
            <Cpu className="h-4 w-4" />
            この端末は WebGPU 非対応です
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chrome / Edge / その他 Chromium 系ブラウザの最新版でご利用ください。
            このブラウザでは AI アシスタントを利用できません。
          </p>
        </CardContent>
      </Card>
    )
  }

  if (webllm.status === "error") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-3 text-sm font-bold text-destructive">
            <AlertCircle className="h-4 w-4" />
            WebGPU でエラーが発生しました
          </div>
          <p className="text-xs opacity-80 break-all">{webllm.error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => webllm.loadModel().catch(() => {})}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> 再試行
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (webllm.status === "idle" || webllm.status === "downloading") {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Download className="h-3.5 w-3.5" />
            モデルを準備中（初回のみ）...
          </div>
          <Progress value={Math.max(webllm.progress * 100, 5)} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {WEBLLM_MODEL_INFO.name}（約 {WEBLLM_MODEL_INFO.downloadMB}MB / 初回のみ）を
            ダウンロードしています。完了すると AI 機能が使えるようになります。
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── メインUI ────────────────────────────────

  return (
    <div className="space-y-6">
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI機能（ローカル）利用に関するご確認
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-sm">
              <p>
                この AI 機能は<b>ブラウザ内（WebGPU）</b>で動作します。
                記事の内容は一切サーバーへ送信されません。
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>初回のみモデルのダウンロード（約 {WEBLLM_MODEL_INFO.downloadMB}MB）が発生します。</li>
                <li>不正確な情報や不適切な内容を生成する可能性があります。</li>
              </ul>
              <p className="font-bold text-foreground">
                AIが生成した内容は必ずご自身で確認・修正した上で、自己責任でご利用ください。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptAiWarning}>
              承諾して利用する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
          AI アシスタント (Qwen3 1.7B)
          </CardTitle>
          <CardDescription className="text-xs">
            ブラウザ内で動作するローカルAIが執筆をサポートします。
          </CardDescription>
          {/* [追加] GPU 情報・推定 VRAM・稼働状態の表示 */}
          <GPUInfoLine
            gpuInfo={webllm.gpuInfo}
            busy={isGenerating}
            vramMB={WEBLLM_MODEL_INFO.vramMB}
          />
        </CardHeader>

        <CardContent className="space-y-4">

          {/* 検索セクション */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                placeholder="最新情報を検索してAIに学習させる..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-9"
                onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearch()}
              />
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={isSearching}
                className="h-9 shrink-0"
              >
                {isSearching
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* タイトルから検索クエリを補完するショートカット */}
            {title && !searchQuery && (
              <button
                onClick={handleFillQueryFromTitle}
                className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Wand2 className="h-2.5 w-2.5" />
                記事タイトルで検索する
              </button>
            )}

            {/* 検索結果表示 */}
            {searchResults && (
              <div className="p-3 bg-background/50 rounded-lg text-[10px] border border-border space-y-2">
                <div className="font-bold flex items-center justify-between border-b border-border pb-1">
                  <span className="flex items-center gap-1">
                    <Search className="h-3 w-3" /> 取得済みの最新情報
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={() => setIsEditingSearch(!isEditingSearch)}
                    >
                      {isEditingSearch ? "確定" : "編集"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px]"
                      onClick={() => { setSearchResults(null); setIsEditingSearch(false) }}
                    >
                      <X className="h-2.5 w-2.5 mr-0.5" />破棄
                    </Button>
                  </div>
                </div>
                {isEditingSearch ? (
                  <Textarea
                    value={searchResults}
                    onChange={(e) => setSearchResults(e.target.value)}
                    className="text-[10px] min-h-[100px] bg-background/80"
                  />
                ) : (
                  <div className="max-h-32 overflow-y-auto pr-1 leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {searchResults}
                  </div>
                )}
                <p className="text-[9px] italic text-primary/70">
                  ※これらの情報は次のAIアクションで自動的に活用されます
                </p>
              </div>
            )}
          </div>

          {/* メインアクション */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 font-bold h-10"
              onClick={() => withAiWarning(handleImproveContent)}
              disabled={isGenerating || !content}
            >
              {activeAction === "improve"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <RefreshCw className="h-3 w-3" />}
              内容を改善
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 font-bold h-10"
              onClick={() => withAiWarning(handleSuggestTitle)}
              disabled={isGenerating || !content}
            >
              {activeAction === "title"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Type className="h-3 w-3" />}
              タイトル提案
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 font-bold h-10"
              onClick={() => withAiWarning(handleGenerateTags)}
              disabled={isGenerating || !content}
            >
              {activeAction === "tags"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <TagIcon className="h-3 w-3" />}
              タグ生成
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 font-bold h-10"
              onClick={() => withAiWarning(handleGenerateSummary)}
              disabled={isGenerating || !content}
            >
              {activeAction === "summary"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <FileText className="h-3 w-3" />}
              要約作成
            </Button>
          </div>

          {/* [追加] 生成中のライブ状況（経過時間・速度・遅延案内） */}
          {isGenerating && (
            <AILiveStatus
              isGenerating={isGenerating}
              phase={webllm.phase}
              elapsedMs={webllm.elapsedMs}
              tps={webllm.liveTps}
              tokens={webllm.liveTokens}
            />
          )}

          {!content && (
            <p className="text-[10px] text-muted-foreground text-center italic">
              記事を入力するとAI機能が使えます
            </p>
          )}

          {/* タイトル提案結果 */}
          {suggestedTitles.length > 0 && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Type className="h-3 w-3" /> タイトル案を選択
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px]"
                  onClick={() => setSuggestedTitles([])}
                >
                  閉じる
                </Button>
              </div>
              <div className="space-y-2">
                {suggestedTitles.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onUpdateTitle(t)
                      setSuggestedTitles([])
                      toast.success("タイトルを反映しました")
                    }}
                    className="w-full text-left p-2.5 text-xs bg-background hover:bg-primary/5 border border-border hover:border-primary/30 rounded-lg transition-all group flex items-center justify-between"
                  >
                    <span className="flex-1">{t}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* タグ提案結果 */}
          {suggestedTags.length > 0 && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <TagIcon className="h-3 w-3" /> タグを追加
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] text-primary"
                    onClick={handleAddAllTags}
                  >
                    すべて追加
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px]"
                    onClick={() => setSuggestedTags([])}
                  >
                    閉じる
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map((tag, i) => {
                  const isExisting = tags.includes(tag)
                  return (
                    <Badge
                      key={i}
                      variant={isExisting ? "secondary" : "outline"}
                      className={cn(
                        "cursor-pointer px-2 py-1 text-[10px] font-medium transition-all",
                        !isExisting && "hover:bg-primary/10 hover:border-primary/50"
                      )}
                      onClick={() => {
                        if (!isExisting) {
                          onUpdateTags([...tags, tag])
                          toast.success(`#${tag} を追加しました`)
                        }
                      }}
                    >
                      {isExisting
                        ? <Check className="h-2 w-2 mr-1" />
                        : <Plus className="h-2 w-2 mr-1" />}
                      {tag}
                    </Badge>
                  )
                })}
              </div>
              <p className="text-[9px] text-muted-foreground italic">
                ※クリックで個別追加、「すべて追加」で一括追加できます
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
