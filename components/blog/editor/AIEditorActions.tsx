"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { UseGemmaReturn } from "@/hooks/use-gemma"
import { searchWeb } from "@/actions/search"
import { getAiSettings } from "@/actions/user"
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
} from "lucide-react"
import { toast } from "sonner"
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
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface AIEditorActionsProps {
  gemma: UseGemmaReturn
  title: string
  content: string
  tags: string[]
  onUpdateTitle: (title: string) => void
  onUpdateContent: (content: string) => void
  onUpdateTags: (tags: string[]) => void
  onUpdateSummary: (summary: string) => void
}

export const AIEditorActions: React.FC<AIEditorActionsProps> = ({
  gemma,
  title,
  content,
  tags,
  onUpdateTitle,
  onUpdateContent,
  onUpdateTags,
  onUpdateSummary
}) => {
  const { isLoading, error, generateResponse, isGenerating, downloadProgress } = gemma
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<string | null>(null)
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [activeAction, setActiveAction] = useState<"improve" | "title" | "tags" | "summary" | null>(null)
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

  // ── AI アクション ────────────────────────────

  const handleImproveContent = async () => {
    if (!content) return
    setActiveAction("improve")
    const prompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : "あなたはプロの編集者です。"}
以下のブログ記事を、読者の興味を惹きつける、洗練された自然な日本語の文章にブラッシュアップしてください。
構成は維持しつつ、表現をより豊かに、専門用語は分かりやすく説明を加えてください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}
${aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : ""}

重要:
- 出力は改善後のMarkdown形式の本文のみとし、前置きや解説は一切不要です。
- 「*」や「#」などの装飾を過剰に使わず、読みやすさを最優先してください。
- 検索結果が提供されている場合は、その事実を自然に本文に組み込んでください。

${searchResults ? `以下の最新情報を内容に取り入れてください:\n${searchResults}\n\n` : ""}

記事タイトル: ${title}
記事内容:
${content}
`
    try {
      const improved = await generateResponse(prompt)
      const cleanImproved = improved
        .replace(/^```markdown\n/, "")
        .replace(/^```\n?/, "")
        .replace(/\n```$/, "")
        .trim()
      onUpdateContent(cleanImproved)
      toast.success("記事を改善しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AIによる改善に失敗しました。")
    } finally {
      setActiveAction(null)
    }
  }

  const handleSuggestTitle = async () => {
    if (!content) return
    setActiveAction("title")
    const prompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : ""}
以下の記事の内容に最もふさわしい、読者がクリックしたくなるような魅力的なタイトルを日本語で5つ提案してください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}
${aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : ""}

重要:
- 1行に1つずつタイトルのみを出力してください。
- 「*」や「提案1：」などの記号・接頭辞、番号、Markdown装飾は一切不要です。

${searchResults ? `検索文脈:\n${searchResults}\n\n` : ""}

記事内容:
${content.substring(0, 2000)}
`
    try {
      const suggestions = await generateResponse(prompt)
      const titles = suggestions
        .split("\n")
        .map(t => t.replace(/^[0-9一二三四五].?[\s.．:：、]/, "").replace(/[*#]/g, "").trim())
        .filter(t => t.length > 0)
        .slice(0, 5)
      setSuggestedTitles(titles)
      toast.success("タイトル候補を生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "タイトル提案に失敗しました。")
    } finally {
      setActiveAction(null)
    }
  }

  const handleGenerateTags = async () => {
    if (!content) return
    setActiveAction("tags")
    const prompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : ""}
以下の記事に関連する、検索されやすい重要なキーワード（タグ）を5つから8つ程度抽出してください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}

重要:
- カンマ区切りで「単語」のみを出力してください。
- 文章や説明、Markdown装飾（*など）は一切不要です。
- 1つ1つのタグは短く、適切な固有名詞や一般名詞にしてください。

${searchResults ? `検索文脈:\n${searchResults}\n\n` : ""}

タイトル: ${title}
記事内容:
${content.substring(0, 1500)}
`
    try {
      const tagsText = await generateResponse(prompt)
      const newTags = tagsText
        .split(/[,、\n]/)
        .map(t => t.replace(/[*#]/g, "").trim())
        .filter(t => t.length > 0 && t.length < 20)
        .slice(0, 10)
      setSuggestedTags(newTags)
      toast.success("タグ候補を生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "タグ生成に失敗しました。")
    } finally {
      setActiveAction(null)
    }
  }

  const handleGenerateSummary = async () => {
    if (!content) return
    setActiveAction("summary")
    const prompt = `
${aiSettings.persona ? `あなたの役割: ${aiSettings.persona}` : ""}
以下のブログ記事を、300文字程度の丁寧な日本語で要約してください。

${aiSettings.instructions ? `追加の指示:\n${aiSettings.instructions}\n` : ""}
${aiSettings.writingStyle ? `文章スタイル: ${aiSettings.writingStyle}` : ""}

重要:
- 要約のテキストのみを出力してください。「要約:」などの接頭辞は不要です。
- Markdown装飾（*、#など）は使用しないでください。

${searchResults ? `検索文脈:\n${searchResults}\n\n` : ""}

記事内容:
${content}
`
    try {
      const summary = await generateResponse(prompt)
      const cleanSummary = summary.replace(/^要約[：:]\s*/, "").replace(/[*#]/g, "").trim()
      onUpdateSummary(cleanSummary)
      toast.success("要約を生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "要約作成に失敗しました。")
    } finally {
      setActiveAction(null)
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

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            AIモデルを準備中...
          </div>
          {downloadProgress ? (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span>Model Data Loading</span>
                <span>{downloadProgress.percentage}%</span>
              </div>
              <Progress value={downloadProgress.percentage} className="h-1" />
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              初回のみ約1.3GBのロードが必要です。
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg flex gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">AIの初期化に失敗しました</p>
          <p className="text-xs opacity-80">{error}</p>
        </div>
      </div>
    )
  }

  // ── メインUI ────────────────────────────────

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI アシスタント (Gemma 2)
          </CardTitle>
          <CardDescription className="text-xs">
            ブラウザ上で動作する高性能AIが執筆をサポートします。
          </CardDescription>
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
              onClick={handleImproveContent}
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
              onClick={handleSuggestTitle}
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
              onClick={handleGenerateTags}
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
              onClick={handleGenerateSummary}
              disabled={isGenerating || !content}
            >
              {activeAction === "summary"
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <FileText className="h-3 w-3" />}
              要約作成
            </Button>
          </div>

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