"use client"

/**
 * ImageCropDialog
 * ファイルアップロード後に画像をトリミング（クロップ）できるダイアログ。
 * 外部ライブラリ不要・Canvas API のみで実装。
 *
 * 使い方:
 *   <ImageCropDialog
 *     open={isCropDialogOpen}
 *     onOpenChange={setIsCropDialogOpen}
 *     imageSrc={rawDataUrl}          // FileReader で読み込んだ base64 文字列
 *     aspectRatio={16 / 9}           // 省略可（undefined でフリーハンド）
 *     onCrop={(croppedDataUrl, file) => { ... }}
 *   />
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  MouseEvent,
  TouchEvent,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Crop,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  CheckCircle2,
  RefreshCw,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── 型定義 ────────────────────────────────────────────────────────────────

interface Point { x: number; y: number }
interface Rect  { x: number; y: number; w: number; h: number }

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** FileReader.readAsDataURL() の結果を渡す */
  imageSrc: string | null
  /** 固定アスペクト比（省略でフリーハンド） */
  aspectRatio?: number
  /** 最大出力幅（px）。デフォルト 1920 */
  maxOutputWidth?: number
  /** クロップ完了コールバック */
  onCrop: (croppedDataUrl: string, file: File) => void
}

// ─── 定数 ──────────────────────────────────────────────────────────────────

const MIN_SCALE = 0.5
const MAX_SCALE = 5
const HANDLE_SIZE = 10 // ハンドルの半径（px）
const MIN_CROP_PX = 20

type HandleDir = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w"

// ─── ユーティリティ ─────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function dataUrlToFile(dataUrl: string, filename = "cropped.jpg"): File {
  const [header, base64] = dataUrl.split(",")
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg"
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new File([arr], filename, { type: mime })
}

// ─── メインコンポーネント ───────────────────────────────────────────────────

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  onOpenChange,
  imageSrc,
  aspectRatio = 16 / 9,
  maxOutputWidth = 1920,
  onCrop,
}) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement | null>(null)

  const [scale, setScale]           = useState(1)
  const [offset, setOffset]         = useState<Point>({ x: 0, y: 0 })
  const [cropRect, setCropRect]     = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [isReady, setIsReady]       = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // ドラッグ管理
  const dragState = useRef<{
    type: "pan" | "crop" | "handle"
    start: Point
    startOffset?: Point
    startCrop?: Rect
    handle?: HandleDir
  } | null>(null)

  // ─── 初期化 ──────────────────────────────────────────────────────────────

  const initCanvas = useCallback(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !imageSrc) return

    const img = new window.Image()
    img.onload = () => {
      imgRef.current = img
      const cw = container.clientWidth
      const ch = container.clientHeight

      // 画像を収めるスケールを計算
      const baseScale = Math.min(cw / img.width, ch / img.height, 1)
      const dispW = img.width  * baseScale
      const dispH = img.height * baseScale

      // 初期オフセット（中央）
      const initOffset = {
        x: (cw - dispW) / 2,
        y: (ch - dispH) / 2,
      }

      // 初期クロップ（アスペクト比を保った最大範囲）
      let cropW: number, cropH: number
      if (aspectRatio) {
        if (dispW / dispH > aspectRatio) {
          cropH = dispH * 0.85
          cropW = cropH * aspectRatio
        } else {
          cropW = dispW * 0.85
          cropH = cropW / aspectRatio
        }
      } else {
        cropW = dispW * 0.85
        cropH = dispH * 0.85
      }

      const initCrop: Rect = {
        x: initOffset.x + (dispW - cropW) / 2,
        y: initOffset.y + (dispH - cropH) / 2,
        w: cropW,
        h: cropH,
      }

      canvas.width  = cw
      canvas.height = ch
      setScale(baseScale)
      setOffset(initOffset)
      setCropRect(initCrop)
      setIsReady(true)
    }
    img.src = imageSrc
  }, [imageSrc, aspectRatio])

  useEffect(() => {
    if (open && imageSrc) {
      setIsReady(false)
      setTimeout(initCanvas, 50)
    }
    if (!open) {
      setIsReady(false)
    }
  }, [open, imageSrc, initCanvas])

  // ─── 描画 ──────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 画像描画
    ctx.save()
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale)
    ctx.restore()

    // 暗幕オーバーレイ（クロップ外）
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h)

    // クロップ範囲の画像（そのまま描画済みなので上書きは不要）
    // 枠線
    ctx.strokeStyle = "rgba(255,255,255,0.9)"
    ctx.lineWidth   = 1.5
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h)

    // グリッド（三分割線）
    ctx.strokeStyle = "rgba(255,255,255,0.25)"
    ctx.lineWidth   = 0.8
    for (let i = 1; i < 3; i++) {
      const gx = cropRect.x + (cropRect.w / 3) * i
      const gy = cropRect.y + (cropRect.h / 3) * i
      ctx.beginPath(); ctx.moveTo(gx, cropRect.y); ctx.lineTo(gx, cropRect.y + cropRect.h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cropRect.x, gy); ctx.lineTo(cropRect.x + cropRect.w, gy); ctx.stroke()
    }

    // コーナーハンドル
    const handles = getHandlePositions(cropRect)
    ctx.fillStyle   = "#ffffff"
    ctx.strokeStyle = "rgba(0,0,0,0.3)"
    ctx.lineWidth   = 1
    handles.forEach(({ x, y }) => {
      ctx.beginPath()
      ctx.arc(x, y, HANDLE_SIZE, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
    ctx.restore()
  }, [offset, scale, cropRect])

  useEffect(() => {
    if (isReady) draw()
  }, [isReady, draw])

  // ─── ハンドル位置 ────────────────────────────────────────────────────────

  function getHandlePositions(r: Rect): { x: number; y: number; dir: HandleDir }[] {
    const { x, y, w, h } = r
    return [
      { x: x,       y: y,       dir: "nw" },
      { x: x + w/2, y: y,       dir: "n"  },
      { x: x + w,   y: y,       dir: "ne" },
      { x: x + w,   y: y + h/2, dir: "e"  },
      { x: x + w,   y: y + h,   dir: "se" },
      { x: x + w/2, y: y + h,   dir: "s"  },
      { x: x,       y: y + h,   dir: "sw" },
      { x: x,       y: y + h/2, dir: "w"  },
    ]
  }

  function hitHandle(p: Point, r: Rect): HandleDir | null {
    for (const { x, y, dir } of getHandlePositions(r)) {
      const dx = p.x - x
      const dy = p.y - y
      if (dx * dx + dy * dy <= (HANDLE_SIZE + 4) ** 2) return dir
    }
    return null
  }

  function hitCrop(p: Point, r: Rect): boolean {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
  }

  // ─── ハンドルリサイズ ────────────────────────────────────────────────────

  function resizeCrop(dir: HandleDir, dx: number, dy: number, startCrop: Rect): Rect {
    let { x, y, w, h } = startCrop
    const isHoriz = dir.includes("e") || dir.includes("w")
    const isVert  = dir.includes("n") || dir.includes("s")

    if (dir.includes("e")) w = Math.max(MIN_CROP_PX, w + dx)
    if (dir.includes("s")) h = Math.max(MIN_CROP_PX, h + dy)
    if (dir.includes("w")) { const dw = Math.min(dx, startCrop.w - MIN_CROP_PX); x += dw; w = Math.max(MIN_CROP_PX, w - dw) }
    if (dir.includes("n")) { const dh = Math.min(dy, startCrop.h - MIN_CROP_PX); y += dh; h = Math.max(MIN_CROP_PX, h - dh) }

    // アスペクト比固定
    if (aspectRatio) {
      if (isHoriz && !isVert) h = w / aspectRatio
      else if (isVert && !isHoriz) w = h * aspectRatio
      else {
        // コーナー：幅優先
        h = w / aspectRatio
      }
      // nw / ne 方向でy座標も調整
      if (dir.includes("n")) y = startCrop.y + startCrop.h - h
      if (dir.includes("w") && !dir.includes("n")) {} // already handled
    }

    return { x, y, w, h }
  }

  // ─── マウス / タッチ イベント ─────────────────────────────────────────

  function getPoint(e: MouseEvent | TouchEvent): Point {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    if ("touches" in e) {
      const t = e.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
  }

  function onPointerDown(e: MouseEvent | TouchEvent) {
    const p = getPoint(e)
    const handle = hitHandle(p, cropRect)
    if (handle) {
      dragState.current = { type: "handle", start: p, startCrop: { ...cropRect }, handle }
      return
    }
    if (hitCrop(p, cropRect)) {
      dragState.current = { type: "crop", start: p, startCrop: { ...cropRect } }
      return
    }
    dragState.current = { type: "pan", start: p, startOffset: { ...offset } }
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (!dragState.current) return
    const p  = getPoint(e)
    const ds = dragState.current
    const dx = p.x - ds.start.x
    const dy = p.y - ds.start.y

    if (ds.type === "pan" && ds.startOffset) {
      setOffset({ x: ds.startOffset.x + dx, y: ds.startOffset.y + dy })
    } else if (ds.type === "crop" && ds.startCrop) {
      setCropRect({
        x: ds.startCrop.x + dx,
        y: ds.startCrop.y + dy,
        w: ds.startCrop.w,
        h: ds.startCrop.h,
      })
    } else if (ds.type === "handle" && ds.startCrop && ds.handle) {
      setCropRect(resizeCrop(ds.handle, dx, dy, ds.startCrop))
    }
  }

  function onPointerUp() {
    dragState.current = null
  }

  // ─── ズーム ────────────────────────────────────────────────────────────

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(s => clamp(s + delta, MIN_SCALE, MAX_SCALE))
  }

  // ─── クロップ実行 ─────────────────────────────────────────────────────

  const executeCrop = useCallback(async () => {
    const img = imgRef.current
    if (!img) return
    setIsProcessing(true)

    try {
      // 画像座標へ逆変換
      const sx = (cropRect.x - offset.x) / scale
      const sy = (cropRect.y - offset.y) / scale
      const sw = cropRect.w / scale
      const sh = cropRect.h / scale

      // 出力サイズ
      const outW = Math.min(Math.round(sw), maxOutputWidth)
      const outH = aspectRatio ? Math.round(outW / aspectRatio) : Math.round((sh / sw) * outW)

      const out = document.createElement("canvas")
      out.width  = outW
      out.height = outH
      const ctx  = out.getContext("2d")!
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

      const dataUrl = out.toDataURL("image/jpeg", 0.92)
      const file    = dataUrlToFile(dataUrl, "thumbnail.jpg")
      onCrop(dataUrl, file)
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }, [cropRect, offset, scale, aspectRatio, maxOutputWidth, onCrop, onOpenChange])

  // ─── UI ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full rounded-2xl p-0 overflow-hidden border border-border/60 shadow-2xl gap-0">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/40 bg-muted/20 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Crop className="h-4 w-4 text-primary" />
              </div>
              画像をトリミング
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              切り取り範囲をドラッグで調整してください。
              スクロールでズーム・範囲外をドラッグで画像を移動できます。
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Canvas エリア */}
        <div
          ref={containerRef}
          className="relative bg-black/90 select-none overflow-hidden"
          style={{ height: 400 }}
        >
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn(
              "block w-full h-full cursor-crosshair transition-opacity",
              isReady ? "opacity-100" : "opacity-0"
            )}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            onWheel={onWheel}
          />
        </div>

        {/* ツールバー */}
        <div className="px-6 py-3 border-t border-b border-border/40 bg-muted/10 flex items-center gap-4 shrink-0">
          {/* ズームスライダー */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ZoomOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Slider
              value={[scale]}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.05}
              onValueChange={([v]) => setScale(v)}
              className="flex-1"
            />
            <ZoomIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Badge variant="secondary" className="text-[10px] font-mono min-w-10 justify-center shrink-0">
              {Math.round(scale * 100)}%
            </Badge>
          </div>

          {/* リセット */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={initCanvas}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            リセット
          </Button>
        </div>

        {/* 操作ヒント */}
        <div className="px-6 py-2 flex items-center gap-4 text-[11px] text-muted-foreground bg-muted/5 shrink-0">
          <span className="flex items-center gap-1">
            <Move className="h-3 w-3" />
            範囲外ドラッグ: 移動
          </span>
          <span className="flex items-center gap-1">
            <Crop className="h-3 w-3" />
            枠ドラッグ: クロップ移動
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            コーナー: リサイズ
          </span>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-muted-foreground font-mono">
            {isReady && aspectRatio && (
              <span className="flex items-center gap-1">
                <Crop className="h-3 w-3" />
                {aspectRatio === 16 / 9 ? "16:9" : aspectRatio === 4 / 3 ? "4:3" : "カスタム"} 固定
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeCrop}
              disabled={!isReady || isProcessing}
              className="rounded-xl min-w-28"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  トリミング確定
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImageCropDialog