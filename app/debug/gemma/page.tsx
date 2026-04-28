"use client"

import { useState, useRef, useEffect } from "react"
import { useGemma } from "@/hooks/use-gemma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Cpu, Gauge, AlertCircle, CheckCircle2 } from "lucide-react"

export default function GemmaDebugPage() {
  const { isLoading, error, generateResponse, isGenerating } = useGemma()
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [metrics, setMetrics] = useState<{
    startTime: number
    firstTokenTime: number
    endTime: number
    tokenCount: number
  } | null>(null)
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebGpuSupported(!!(navigator as any).gpu)
    }
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return

    setResponse("")
    const startTime = performance.now()
    setMetrics({
      startTime,
      firstTokenTime: 0,
      endTime: 0,
      tokenCount: 0,
    })

    try {
      let firstTokenReceived = false
      let charCount = 0

      const result = await generateResponse(prompt, (partialText) => {
        if (!firstTokenReceived) {
          setMetrics(prev => prev ? { ...prev, firstTokenTime: performance.now() } : null)
          firstTokenReceived = true
        }
        setResponse(partialText)
        charCount = partialText.length
      })

      const endTime = performance.now()
      setMetrics(prev => prev ? {
        ...prev,
        endTime,
        tokenCount: Math.ceil(charCount / 2) // 簡易的なトークン数推定
      } : null)
    } catch (err) {
      console.error(err)
    }
  }

  const tps = metrics?.endTime && metrics?.tokenCount
    ? (metrics.tokenCount / ((metrics.endTime - metrics.startTime) / 1000)).toFixed(2)
    : null

  const latency = metrics?.firstTokenTime
    ? (metrics.firstTokenTime - metrics.startTime).toFixed(0)
    : null

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gemma 性能デバッグ</h1>
        <p className="text-muted-foreground">
          ブラウザ上で動作する Gemma-2b-it-gpu-int4 の初期化状態と生成パフォーマンスを確認できます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              環境
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {webGpuSupported === null ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : webGpuSupported ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  WebGPU サポート
                </Badge>
              ) : (
                <Badge variant="destructive">WebGPU 未サポート</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              初期化状態
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                モデルをロード中...
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                エラー
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                準備完了
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">推論速度 (推定)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tps ? `${tps} tok/s` : "---"}
            </div>
            <p className="text-xs text-muted-foreground">
              レイテンシ: {latency ? `${latency}ms` : "---"}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">初期化に失敗しました</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {error}
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                  <li>Edge/Chrome の場合: <code className="bg-muted px-1 rounded">edge://flags</code> または <code className="bg-muted px-1 rounded">chrome://flags</code> で "WebGPU" を検索し、有効になっているか確認してください。</li>
                  <li>ブラウザが最新バージョンであることを確認してください。</li>
                  <li>ハードウェアアクセラレーションがブラウザの設定で有効になっているか確認してください。</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="プロンプトを入力..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={isLoading || isGenerating || !!error}
          />
          <Button
            onClick={handleGenerate}
            disabled={isLoading || isGenerating || !prompt.trim() || !!error}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="ml-2">生成</span>
          </Button>
        </div>

        <Card className="min-h-[300px]">
          <CardHeader>
            <CardTitle className="text-sm font-medium">生成結果</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] w-full rounded-md border p-4">
              {response ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {response}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  応答がここに表示されます。
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground space-y-2">
        <p>※ Gemma 2b int4 モデル（約1.3GB）をダウンロードするため、初回は時間がかかります。</p>
        <p>※ トークン数は文字数から推定しているため、実際の値とは異なる場合があります。</p>
      </div>
    </div>
  )
}
