"use client"

import React from "react"
import { Cpu, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GPUInfo } from "@/hooks/use-webllm"

interface GPUInfoLineProps {
  gpuInfo: GPUInfo | null
  /** 推論中なら「稼働中」を点滅表示 */
  busy?: boolean
  /** モデルの推定 VRAM 使用量（MB）。表示すると VRAM の目安が伝わる */
  vramMB?: number
  className?: string
}

/** GPU アダプタ名を表示用に整形する */
export function gpuDisplayName(info: GPUInfo | null): string {
  if (!info) return "WebGPU"
  return (
    info.device ||
    info.description ||
    [info.vendor, info.architecture].filter(Boolean).join(" ") ||
    "WebGPU"
  )
}

/**
 * GPU（アダプタ）情報を 1 行で表示する。
 * WebGPU は実際の GPU 使用率 API を公開しないため、利用率そのものではなく
 * アダプタ名とモデルの推定 VRAM 使用量、稼働中フラグを表示する。
 */
export const GPUInfoLine: React.FC<GPUInfoLineProps> = ({
  gpuInfo,
  busy = false,
  vramMB,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0",
        className
      )}
      title="WebGPU は実際の GPU 使用率を公開しないため、名前・VRAM 目安・稼働状態を表示しています"
    >
      <Cpu className="h-3 w-3 text-primary shrink-0" />
      <span className="truncate font-medium">{gpuDisplayName(gpuInfo)}</span>
      {busy && (
        <span className="flex items-center gap-1 text-green-600 shrink-0">
          <Activity className="h-2.5 w-2.5 animate-pulse" />
          稼働中
        </span>
      )}
      {typeof vramMB === "number" && vramMB > 0 && (
        <span className="shrink-0 text-muted-foreground/70">
          · VRAM 約 {(vramMB / 1024).toFixed(1)}GB
        </span>
      )}
    </div>
  )
}

export default GPUInfoLine
