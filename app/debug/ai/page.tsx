"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useWebLLM, WEBLLM_MODEL_INFO } from "@/hooks/use-webllm"
import { GPUInfoLine } from "@/components/blog/ai/GPUInfoLine"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Send,
  Cpu,
  Gauge,
  AlertCircle,
  Terminal,
  Download,
  Zap,
  History,
  Trash2,
  Maximize2,
  RefreshCw,
  Info,
  CheckCircle2,
  Database,
  HardDrive,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: string
  timestamp: string
  type: "info" | "error" | "warn" | "system"
  message: string
}

export default function AIStatsPage() {
  const webllm = useWebLLM()
  const isGenerating = webllm.status === "generating"
  const isLoading = webllm.webgpuSupport === "checking"
  const error = webllm.error
  const initialized = webllm.status === "ready"
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [metrics, setMetrics] = useState<{
    startTime: number
    firstTokenTime: number
    endTime: number
    tokenCount: number
  } | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }
    setLogs(prev => [...prev.slice(-99), newLog]) // 直近100件を保持
  }, [])

  // コンソールログをフックしてデバッグ画面に表示
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), "info")
      originalLog(...args)
    }
    console.error = (...args) => {
      addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), "error")
      originalError(...args)
    }
    console.warn = (...args) => {
      addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), "warn")
      originalWarn(...args)
    }

    addLog("デバッグセッションを開始しました", "system")

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [addLog])

  // WebGPU 対応端末ではモデルを自動ロード
  useEffect(() => {
    if (webllm.webgpuSupport !== "supported") return
    if (webllm.status !== "idle") return
    webllm.loadModel().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webllm.webgpuSupport])

  // ログが追加されたら自動スクロール
  useEffect(() => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [logs])

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return

    setResponse("")
    addLog(`ユーザープロンプト: ${prompt}`, "info")
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

      await webllm.generate(
        [{ role: "user", content: prompt }],
        {
          temperature: 0.7,
          maxTokens: 1024,
          onProgress: (partialText) => {
            if (!firstTokenReceived) {
              const firstTokenTime = performance.now()
              setMetrics(prev => prev ? { ...prev, firstTokenTime } : null)
              firstTokenReceived = true
              addLog(`最初のトークンを受信 (${(firstTokenTime - startTime).toFixed(0)}ms)`, "system")
            }
            setResponse(partialText)
            charCount = partialText.length
          },
        }
      )

      const endTime = performance.now()
      const tokenCount = Math.ceil(charCount / 2)
      setMetrics(prev => prev ? {
        ...prev,
        endTime,
        tokenCount
      } : null)
      addLog(`生成完了: ${tokenCount} トークン (約${((endTime - startTime) / 1000).toFixed(2)}s)`, "system")
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`生成エラー: ${errMsg}`, "error")
    }
  }

  const tps = metrics?.endTime && metrics?.tokenCount
    ? (metrics.tokenCount / ((metrics.endTime - metrics.startTime) / 1000)).toFixed(2)
    : null

  const latency = metrics?.firstTokenTime
    ? (metrics.firstTokenTime - metrics.startTime).toFixed(0)
    : null

  const modelStatusLabel =
    webllm.status === "ready" ? "READY"
    : webllm.status === "downloading" ? "DOWNLOADING"
    : webllm.status === "generating" ? "GENERATING"
    : webllm.status === "error" ? "ERROR"
    : webllm.status === "idle" ? "IDLE"
    : "CHECKING"

  const canChat = webllm.webgpuSupport === "supported" && !error

  return (
    <div className="container max-w-none py-6 md:py-10 space-y-6 md:space-y-8 animate-in fade-in duration-700 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">AI ({WEBLLM_MODEL_INFO.name}) 性能デバッグ</h1>
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest px-2 py-0">WebGPU</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl font-medium">
            ブラウザ内で動作するローカル LLM の推論パフォーマンスをリアルタイムで監視・解析します。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            <Trash2 className="w-4 h-4 mr-2" />
            ログを消去
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            リロード
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-premium border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              環境状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {webllm.webgpuSupport === "checking" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : webllm.webgpuSupport === "supported" ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-green-500">WebGPU Enabled</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Hardware Acceleration Active</span>
                  <GPUInfoLine
                    gpuInfo={webllm.gpuInfo}
                    busy={isGenerating}
                    vramMB={WEBLLM_MODEL_INFO.vramMB}
                    className="mt-1"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-destructive">WebGPU Disabled</span>
                  <span className="text-[10px] text-muted-foreground font-mono">AI 利用不可</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-premium border-none", initialized ? "bg-green-500/5" : "bg-muted/30")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              モデル状態
            </CardTitle>
          </CardHeader>
          <CardContent>
            {webllm.status === "downloading" ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xl font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {Math.round(webllm.progress * 100)}%
                </div>
                <Progress value={webllm.progress * 100} className="h-1 mt-1" />
                <span className="text-[10px] text-muted-foreground font-mono uppercase truncate mt-1">
                  {webllm.progressText || "Downloading model"}
                </span>
              </div>
            ) : webllm.status === "error" ? (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-destructive">ERROR</span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase truncate">{error}</span>
              </div>
            ) : webllm.status === "idle" ? (
              <div className="flex flex-col gap-2">
                <span className="text-xl font-bold text-muted-foreground">IDLE</span>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => webllm.loadModel().catch(() => {})}>
                  <Download className="w-3 h-3 mr-1" /> モデルをロード
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-green-500">{modelStatusLabel}</span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase italic text-green-500/60">Inference Ready</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              推論速度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-0.5">
              <div className="text-2xl font-black italic">
                {(isGenerating ? webllm.liveTps : (webllm.lastTokensPerSec ?? tps)) ?? "---"}
                <span className="text-sm font-normal not-italic text-muted-foreground ml-1 uppercase">tok/s</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">
                Latency: {(isGenerating ? null : (webllm.lastTTFT ?? latency)) ? `${webllm.lastTTFT ?? latency}ms` : "N/A"}
              </p>
              {isGenerating && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">
                      {webllm.phase === "prefill" ? "PREFILL (初回トークン待機)" : "STREAMING"}
                    </span>
                    <span className="text-green-500 font-bold">
                      {Math.floor((webllm.elapsedMs ?? 0) / 1000)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>TOKENS</span>
                    <span className="text-foreground font-bold">{webllm.liveTokens ?? 0}</span>
                  </div>
                  {webllm.phase === "prefill" && (webllm.elapsedMs ?? 0) >= 8000 && (
                    <p className="text-[10px] text-amber-500 font-bold animate-pulse">
                      初回トークンに時間がかかっています（処理は継続中）
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              モデル / キャッシュ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-xl font-bold">
                {initialized ? "Loaded" : "Pending"}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {WEBLLM_MODEL_INFO.name} / {WEBLLM_MODEL_INFO.downloadMB}MB
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-premium overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-3 bg-destructive/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-destructive tracking-tight">INITIALIZATION FAILED</p>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {error}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => webllm.loadModel().catch(() => {})}>
                    <RefreshCw className="w-3 h-3 mr-1" /> 再試行
                  </Button>
                  <Badge variant="outline" className="bg-background text-[10px] font-mono border-destructive/20">Chrome/Edge Flags: WebGPU=Enabled</Badge>
                  <Badge variant="outline" className="bg-background text-[10px] font-mono border-destructive/20">Hardware Acceleration: On</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 生成セクション */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <History className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-black tracking-tight">Inference Preview</h2>
          </div>

          <div className="relative group">
            <Input
              placeholder="AI への命令を入力してください..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={isLoading || isGenerating || !canChat}
              className="h-14 pl-6 pr-16 text-base rounded-2xl border-none bg-muted/50 focus-visible:ring-primary shadow-premium transition-all"
            />
            <Button
              onClick={handleGenerate}
              disabled={isLoading || isGenerating || !prompt.trim() || !canChat}
              className="absolute right-2 top-2 h-10 w-10 p-0 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <Card className="min-h-[400px] shadow-premium border-none bg-muted/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                <span>Output Stream</span>
                {isGenerating && <Badge variant="secondary" className="animate-pulse bg-primary/10 text-primary border-none">GENERATE ACTIVE</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[320px] w-full rounded-md">
                {response ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                    {response}
                    {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20 gap-4">
                    <Maximize2 className="w-12 h-12" />
                    <p className="text-xs font-black uppercase tracking-tighter">Waiting for input...</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ログセクション */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Terminal className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-black tracking-tight">System Logs</h2>
          </div>
          <Card className="h-[514px] shadow-premium border-none bg-black text-zinc-300 font-mono text-[11px] overflow-hidden">
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Console Stream</span>
            </div>
            <ScrollArea className="h-[460px] w-full p-4">
              <div className="space-y-1.5">
                {logs.length === 0 && (
                  <p className="text-zinc-700 italic">No logs captured yet.</p>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                    <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={cn(
                      "font-bold shrink-0 w-12",
                      log.type === "error" && "text-red-400",
                      log.type === "warn" && "text-amber-400",
                      log.type === "system" && "text-blue-400",
                      log.type === "info" && "text-zinc-500"
                    )}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className={cn(
                      "break-all",
                      log.type === "error" && "text-red-300",
                      log.type === "warn" && "text-amber-200"
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 text-xs text-muted-foreground space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground">Debugging Information</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-inside list-disc font-medium">
          <li>{WEBLLM_MODEL_INFO.name}（{WEBLLM_MODEL_INFO.params} / {WEBLLM_MODEL_INFO.quantization} / {WEBLLM_MODEL_INFO.license}）をブラウザ内で直接実行しています。</li>
          <li>WebGPU 経由で GPU 上で推論し、記事データは一切サーバーへ送信されません。</li>
          <li>モデルは初回のみ約 {WEBLLM_MODEL_INFO.downloadMB}MB をダウンロードし、以降は端末内（IndexedDB）にキャッシュされます。</li>
          <li>トークン数は文字数（2文字=1トークン）による簡易推定値です。</li>
          <li>推論速度（tok/s）は GPU とブラウザの設定によって変動します。</li>
          <li>モデルのロードには VRAM 約 {WEBLLM_MODEL_INFO.vramMB}MB が必要です。</li>
        </ul>
      </div>
    </div>
  )
}
