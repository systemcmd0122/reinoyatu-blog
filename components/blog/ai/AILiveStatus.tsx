"use client"

import React from "react"
import { Cpu, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  FIRST_TOKEN_SLOW_MS,
  LONG_GENERATION_MS,
  type WebLLMPhase,
} from "@/hooks/use-webllm"

interface AILiveStatusProps {
  /** 現在推論中かどうか */
  isGenerating: boolean
  /** 生成フェーズ（prefill = 初回トークン待機 / streaming = 生成中） */
  phase: WebLLMPhase | null
  /** 生成開始からの経過ミリ秒 */
  elapsedMs: number | null
  /** リアルタイム生成速度（トークン/秒） */
  tps: number | null
  /** 生成済みトークン数 */
  tokens: number | null
  /**
   * GPU 負荷バーの基準速度（tok/s）。WebGPU は実際の GPU 使用率を
   * 公開しないため、生成速度を負荷の目安として表示する。
   * デフォルト 60 tok/s（Qwen3-1.7B の WebGPU 実測上限近傍）。
   */
  maxTps?: number
  className?: string
}

/** ミリ秒を「m:ss」形式へ整形する */
function formatDuration(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return "0:00"
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * AI 推論中のライブステータス表示。
 *
 * - 経過時間 / 生成速度 / トークン数をリアルタイムに表示し、
 *   「処理が動いているかどうか」を常に可視化する。
 * - 初回トークン（prefill）が遅い場合は明示的な案内を出して
 *   フリーズしていないことを伝える。
 * - GPU 負荷を「生成速度ベース」のバーで目安表示する。
 */
export const AILiveStatus: React.FC<AILiveStatusProps> = ({
  isGenerating,
  phase,
  elapsedMs,
  tps,
  tokens,
  maxTps = 60,
  className,
}) => {
  const slowFirstToken = isGenerating && phase === "prefill" && (elapsedMs ?? 0) >= FIRST_TOKEN_SLOW_MS
  const verySlow = isGenerating && (elapsedMs ?? 0) >= LONG_GENERATION_MS

  const label = !isGenerating
    ? "推論待機中"
    : phase === "prefill"
      ? "初回トークン生成中（プロンプト処理中）..."
      : "文章を生成中..."

  // GPU 負荷の目安（生成速度ベース）。prefill 中は不定シマー。
  const loadPct = tps !== null ? Math.min(100, Math.round((tps / maxTps) * 100)) : 0

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-2",
        isGenerating && "shadow-sm shadow-primary/10",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11px] font-bold text-primary min-w-0">
          {isGenerating ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          ) : (
            <Cpu className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-foreground tabular-nums shrink-0">
          <Timer className="h-3 w-3 text-muted-foreground" />
          {formatDuration(elapsedMs)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="tabular-nums">
          速度 {tps !== null ? <b className="text-foreground">{tps} tok/s</b> : "— tok/s"}
        </span>
        <span className="tabular-nums">
          {tokens !== null ? <b className="text-foreground">{tokens} トークン</b> : "— トークン"}
        </span>
      </div>

      {isGenerating && (
        <div
          className="group relative h-1.5 rounded-full bg-background/60 overflow-hidden"
          title="WebGPU は実際の GPU 使用率を公開しないため、生成速度を負荷の目安として表示しています"
        >
          {phase === "streaming" && tps !== null ? (
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              )}
              style={{ width: `${Math.max(4, loadPct)}%` }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse" />
          )}
        </div>
      )}

      {slowFirstToken && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-[10px] leading-relaxed text-amber-600">
          <b>初回トークンに時間がかかっています。</b>
          <br />
          ローカル AI は端末の GPU 性能に依存するため、数秒〜数十秒かかる場合があります。
          <b>処理は継続中です。</b>長く待てない場合は中断してください。
        </div>
      )}

      {verySlow && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-[10px] leading-relaxed text-destructive">
          <b>{formatDuration(elapsedMs)} 以上経過しています。</b>
          プロンプトが長いか、GPU の負荷が高い可能性があります。
          まだ動いていますが、必要に応じて中断できます。
        </div>
      )}
    </div>
  )
}

export default AILiveStatus
