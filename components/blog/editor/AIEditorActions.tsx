"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { UseGemmaReturn } from "@/hooks/use-gemma"
import { searchWeb } from "@/actions/search"
import {
  Sparkles,
  Search,
  Loader2,
  Check,
  RefreshCw,
  Type,
  Tag as TagIcon,
  FileText,
  Download,
  AlertCircle
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AIEditorActionsProps {
  gemma: UseGemmaReturn
  title: string
  content: string
  onUpdateTitle: (title: string) => void
  onUpdateContent: (content: string) => void
  onUpdateTags: (tags: string[]) => void
  onUpdateSummary: (summary: string) => void
}

export const AIEditorActions: React.FC<AIEditorActionsProps> = ({
  gemma,
  title,
  content,
  onUpdateTitle,
  onUpdateContent,
  onUpdateTags,
  onUpdateSummary
}) => {
  const { isLoading, error, generateResponse, isGenerating, downloadProgress, initialized } = gemma
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const result = await searchWeb(searchQuery)
      if (result.error) {
        toast.error(result.error)
      } else {
        setSearchResults(result.content)
        toast.success("最新情報を取得しました。AIのプロンプトに使用できます。")
      }
    } catch (err) {
      toast.error("検索に失敗しました。")
    } finally {
      setIsSearching(false)
    }
  }

  const handleImproveContent = async () => {
    if (!content) return

    const prompt = `
以下のブログ記事の内容を、より読みやすく、魅力的な文章に改善してください。
出力は改善後のMarkdown本文のみにしてください。

${searchResults ? `以下の最新情報を参考にしてください:\n${searchResults}\n\n` : ""}

記事タイトル: ${title}
記事内容:
${content}
`
    try {
      const improved = await generateResponse(prompt)
      onUpdateContent(improved)
      toast.success("記事を改善しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AIによる改善に失敗しました。")
    }
  }

  const handleSuggestTitle = async () => {
    if (!content) return

    const prompt = `
以下の記事内容に基づき、読者の目を引く魅力的なタイトルを5つ日本語で提案してください。
1行に1つずつ出力してください。

記事内容:
${content.substring(0, 2000)}
`
    try {
      const suggestions = await generateResponse(prompt)
      const titles = suggestions.split("\n").filter(t => t.trim().length > 0).slice(0, 5)
      // 最初の提案をとりあえず反映
      if (titles.length > 0) {
        onUpdateTitle(titles[0].replace(/^\d+\.\s*/, ""))
        toast.success("タイトルを提案し、反映しました。")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "タイトル提案に失敗しました。")
    }
  }

  const handleGenerateTags = async () => {
    if (!content) return

    const prompt = `
以下の記事に関連するタグを3〜5個、カンマ区切りで日本語で出力してください。
タグ以外の説明は不要です。

タイトル: ${title}
記事内容:
${content.substring(0, 1000)}
`
    try {
      const tagsText = await generateResponse(prompt)
      const tags = tagsText.split(/[,、]/).map(t => t.trim()).filter(t => t.length > 0)
      onUpdateTags(tags)
      toast.success("タグを生成しました。")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "タグ生成に失敗しました。")
    }
  }

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
                <span>Downloading model data</span>
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
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">AIの初期化に失敗しました</p>
          <p className="text-xs opacity-80">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI アシスタント (Gemma 2)
          </CardTitle>
          <CardDescription className="text-xs">
            ブラウザ上で動作するため、プライバシーが守られ、無制限に利用可能です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="最新情報を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-9"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="sm" onClick={handleSearch} disabled={isSearching} className="h-9">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults && (
            <div className="p-2 bg-background/50 rounded text-[10px] max-h-24 overflow-y-auto border border-border">
              <div className="font-bold mb-1 flex items-center justify-between">
                <span>検索結果取得済み</span>
                <Button variant="ghost" size="sm" className="h-4 px-1" onClick={() => setSearchResults(null)}>クリア</Button>
              </div>
              {searchResults.substring(0, 200)}...
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={handleImproveContent}
              disabled={isGenerating || !content}
            >
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              記事を改善
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={handleSuggestTitle}
              disabled={isGenerating || !content}
            >
              <Type className="h-3 w-3" />
              タイトル提案
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={handleGenerateTags}
              disabled={isGenerating || !content}
            >
              <TagIcon className="h-3 w-3" />
              タグ生成
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={async () => {
                try {
                  const prompt = `以下の記事の要約を150文字程度で作成してください。\n\n${content}`
                  const summary = await generateResponse(prompt)
                  onUpdateSummary(summary)
                  toast.success("要約を生成しました。")
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "要約作成に失敗しました。")
                }
              }}
              disabled={isGenerating || !content}
            >
              <FileText className="h-3 w-3" />
              要約作成
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
