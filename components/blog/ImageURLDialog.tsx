"use client"

import React, { useState, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, CheckCircle2, AlertCircle, Image as ImageIcon, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageURLDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (imageUrl: string) => void
}

type VerifyStatus = "idle" | "loading" | "success" | "error"

// 任意の画像形式（GIF・SVG・AVIF・WEBP 等）を許容する
const SUPPORTED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "svg",
  "avif", "bmp", "tiff", "ico"
]

function isImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    const pathname = parsed.pathname.toLowerCase()
    return SUPPORTED_EXTENSIONS.some(ext => pathname.endsWith(`.${ext}`))
  } catch {
    return false
  }
}

export const ImageURLDialog: React.FC<ImageURLDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [url, setUrl] = useState("")
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle")
  const [verifiedUrl, setVerifiedUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [previewDimensions, setPreviewDimensions] = useState<{ w: number; h: number } | null>(null)
  const [isGif, setIsGif] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const reset = () => {
    setUrl("")
    setVerifyStatus("idle")
    setVerifiedUrl(null)
    setErrorMessage("")
    setPreviewDimensions(null)
    setIsGif(false)
  }

  const handleClose = (val: boolean) => {
    if (!val) reset()
    onOpenChange(val)
  }

  const verifyUrl = useCallback(async (inputUrl: string) => {
    const trimmed = inputUrl.trim()
    if (!trimmed) {
      setErrorMessage("URLを入力してください")
      setVerifyStatus("error")
      return
    }

    // プロトコルがない場合は補完
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

    try {
      new URL(normalized)
    } catch {
      setErrorMessage("有効なURLを入力してください")
      setVerifyStatus("error")
      return
    }

    setVerifyStatus("loading")
    setVerifiedUrl(null)
    setPreviewDimensions(null)
    setIsGif(false)

    // img要素でロードを試みる（CORS非依存）
    const img = new window.Image()
    img.crossOrigin = "anonymous"

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        img.src = ""
        setErrorMessage("画像の読み込みがタイムアウトしました")
        setVerifyStatus("error")
        resolve()
      }, 8000)

      img.onload = () => {
        clearTimeout(timeout)
        setVerifiedUrl(normalized)
        setPreviewDimensions({ w: img.naturalWidth, h: img.naturalHeight })
        setIsGif(normalized.toLowerCase().includes(".gif") || normalized.toLowerCase().includes("image/gif"))
        setVerifyStatus("success")
        resolve()
      }

      img.onerror = () => {
        clearTimeout(timeout)
        // 拡張子チェックでも判断できない場合は、URLが正しい形式かどうかだけ確認
        if (isImageUrl(normalized)) {
          // 拡張子から画像と判断できる場合は警告付きで許可
          setVerifiedUrl(normalized)
          setIsGif(normalized.toLowerCase().endsWith(".gif"))
          setVerifyStatus("success")
          setErrorMessage("画像を直接確認できませんでしたが、URLは有効です。一部の外部画像はCORS制限により取得できない場合があります。")
        } else {
          setErrorMessage("画像を読み込めませんでした。URLが正しいか確認してください。")
          setVerifyStatus("error")
        }
        resolve()
      }

      img.src = normalized
    })
  }, [])

  const handleSubmit = () => {
    if (verifyStatus === "success" && verifiedUrl) {
      onSelect(verifiedUrl)
      handleClose(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      verifyUrl(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border/60 shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40 bg-muted/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Link className="h-4 w-4 text-primary" />
              </div>
              画像URLを指定
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              画像のURLを入力してサムネイルに設定します。GIF・PNG・JPEG・WebP・SVG・AVIFなど各種形式に対応しています。
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              画像URL
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.gif"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    if (verifyStatus !== "idle") {
                      setVerifyStatus("idle")
                      setVerifiedUrl(null)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "pl-9 text-sm rounded-xl transition-all",
                    verifyStatus === "success" && "border-emerald-500/50 ring-1 ring-emerald-500/20",
                    verifyStatus === "error" && "border-destructive/50 ring-1 ring-destructive/20"
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => verifyUrl(url)}
                disabled={verifyStatus === "loading" || !url.trim()}
                className="shrink-0 rounded-xl px-4 h-10"
              >
                {verifyStatus === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "確認"
                )}
              </Button>
            </div>

            {/* Status messages */}
            {verifyStatus === "error" && errorMessage && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/10">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {verifyStatus === "success" && errorMessage && (
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-200/40 dark:border-amber-800/30">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Supported formats hint */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">対応フォーマット</p>
            <div className="flex flex-wrap gap-1.5">
              {["GIF", "PNG", "JPEG", "WebP", "SVG", "AVIF", "BMP"].map((fmt) => (
                <Badge
                  key={fmt}
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-mono font-medium",
                    fmt === "GIF" && "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200/60 dark:border-violet-700/40"
                  )}
                >
                  {fmt}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview */}
          {verifyStatus === "success" && verifiedUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground font-medium">プレビュー</p>
                <div className="flex items-center gap-2">
                  {isGif && (
                    <Badge className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-300/40 dark:border-violet-700/40 font-mono">
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      アニメGIF
                    </Badge>
                  )}
                  {previewDimensions && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {previewDimensions.w} × {previewDimensions.h}px
                    </span>
                  )}
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border/40 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={verifiedUrl}
                  alt="プレビュー"
                  className="w-full h-full object-cover"
                  // GIF はアニメーションをそのまま表示（unoptimized 相当）
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-border/20 rounded-xl pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/10 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            className="rounded-xl"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={verifyStatus !== "success" || !verifiedUrl}
            className="rounded-xl min-w-20"
          >
            {verifyStatus === "success" && verifiedUrl ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                設定する
              </>
            ) : (
              "設定する"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImageURLDialog