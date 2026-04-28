"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useGemma } from "@/hooks/use-gemma"
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
  CheckCircle2,
  Terminal,
  Download,
  Zap,
  History,
  Trash2,
  Maximize2,
  RefreshCw,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: string
  timestamp: string
  type: "info" | "error" | "warn" | "system"
  message: string
}

export default function GemmaDebugPage() {
  const { isLoading, error, generateResponse, isGenerating, downloadProgress, initialized } = useGemma()
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [metrics, setMetrics] = useState<{
    startTime: number
    firstTokenTime: number
    endTime: number
    tokenCount: number
  } | null>(null)
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null)
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebGpuSupported(!!(navigator as any).gpu)
    }
  }, [])

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

      const result = await generateResponse(prompt, (partialText) => {
        if (!firstTokenReceived) {
          const firstTokenTime = performance.now()
          setMetrics(prev => prev ? { ...prev, firstTokenTime } : null)
          firstTokenReceived = true
          addLog(`最初のトークンを受信 (${(firstTokenTime - startTime).toFixed(0)}ms)`, "system")
        }
        setResponse(partialText)
        charCount = partialText.length
      })

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="container max-w-none py-10 space-y-8 animate-in fade-in duration-700 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black tracking-tight">Gemma 性能デバッグ</h1>
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest px-2 py-0">v2.0 Beta</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl font-medium">
            ブラウザ上で動作する Gemma-2b-it-gpu-int4 の初期化プロセス、ダウンロード状況、および推論パフォーマンスをリアルタイムで監視・解析します。
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-premium border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              環境状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {webGpuSupported === null ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : webGpuSupported ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-green-500">WebGPU Enabled</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Hardware Acceleration Active</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-destructive">WebGPU Disabled</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Falling back to CPU/WASM</span>
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
            {isLoading ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xl font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  LOADING...
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">Initializing Engine</span>
              </div>
            ) : error ? (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-destructive">ERROR</span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase truncate">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-green-500">READY</span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase italic text-green-500/60">Optimized & Inference Ready</span>
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
                {tps ? `${tps}` : "---"}<span className="text-sm font-normal not-italic text-muted-foreground ml-1 uppercase">tok/s</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">
                Latency: {latency ? `${latency}ms` : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-premium border-none bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Download className="w-4 h-4" />
              ダウンロード
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-xl font-bold">
                {downloadProgress ? `${downloadProgress.percentage}%` : initialized ? "100%" : "0%"}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                {downloadProgress ? `${formatBytes(downloadProgress.loaded)} / ${formatBytes(downloadProgress.total)}` : initialized ? "Cached in memory" : "Waiting for start..."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {downloadProgress && downloadProgress.percentage < 100 && (
        <div className="space-y-2 p-6 bg-primary/5 border border-primary/10 rounded-2xl shadow-premium">
          <div className="flex justify-between items-end text-sm font-bold">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 animate-bounce text-primary" />
              <span>モデルデータをダウンロード中...</span>
            </div>
            <span className="font-mono">{downloadProgress.percentage}%</span>
          </div>
          <Progress value={downloadProgress.percentage} className="h-3 bg-primary/10" />
          <p className="text-[10px] text-muted-foreground text-center font-mono">
            約 1.3GB のモデルファイルをフェッチしています。完了するまでページを閉じないでください。
          </p>
        </div>
      )}

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
              placeholder="Gemma への命令を入力してください..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={isLoading || isGenerating || !!error}
              className="h-14 pl-6 pr-16 text-base rounded-2xl border-none bg-muted/50 focus-visible:ring-primary shadow-premium transition-all"
            />
            <Button
              onClick={handleGenerate}
              disabled={isLoading || isGenerating || !prompt.trim() || !!error}
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
          <li>Gemma 2b IT モデル（int4 量子化）を使用しています。</li>
          <li>初回ロード時は約 1.3GB のデータがメモリにキャッシュされます。</li>
          <li>WebGPU が利用可能な場合、GPU アクセラレーションによる高速推論が行われます。</li>
          <li>トークン数は文字数（2文字=1トークン）による簡易推定値です。</li>
          <li>生成エラーが発生した場合は、ハードウェアメモリ（VRAM）不足の可能性があります。</li>
          <li>MediaPipe GenAI WASM ランタイム v0.10.27 を使用して動作しています。</li>
        </ul>
      </div>
    </div>
  )
}
