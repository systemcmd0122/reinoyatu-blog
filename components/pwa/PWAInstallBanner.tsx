"use client"

import { useState, useEffect } from "react"
import { X, Download, Share, Info } from "lucide-react"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { toast } from "sonner"

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa-banner-dismissed")
    if (isDismissed) {
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (!isInstalled && !dismissed && (isInstallable || isIOS)) {
      setShowBanner(true)
    }
  }, [isInstallable, isInstalled, isIOS, dismissed])

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem("pwa-banner-dismissed", "true")
    toast("インストール案内を閉じました", {
      description: "設定画面からいつでもインストールできます",
      action: {
        label: "了解",
        onClick: () => {},
      },
    })
  }

  if (!showBanner) return null

  // モバイルの場合はボトムシート
  if (isMobile) {
    return (
      <Sheet open={showBanner} onOpenChange={(open) => !open && handleDismiss()}>
        <SheetContent side="bottom" className="rounded-t-[20px] p-6 pb-10">
          <SheetHeader className="text-left mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20">
                {isIOS ? (
                  <Share className="h-8 w-8" />
                ) : (
                  <Download className="h-8 w-8" />
                )}
              </div>
              <div>
                <SheetTitle className="text-xl font-black tracking-tight">
                  アプリをインストール
                </SheetTitle>
                <SheetDescription className="text-sm font-medium">
                  {isIOS
                    ? "より快適な閲覧体験のために"
                    : "ホーム画面に追加して、オフラインでも快適に"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <p className="text-sm leading-relaxed text-foreground/80">
                {isIOS ? (
                  <>
                    1. ブラウザの<strong>共有ボタン</strong>をタップします<br />
                    2. <strong>「ホーム画面に追加」</strong>を選択してください
                  </>
                ) : (
                  "プッシュ通知の受け取りや、素早い起動が可能になります。ブラウザの枠を超えた体験を是非。"
                )}
              </p>
            </div>

            {!isIOS && (
              <Button
                onClick={handleInstall}
                className="w-full h-14 text-base font-black rounded-xl shadow-lg shadow-primary/20"
              >
                今すぐインストール
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full h-12 text-sm font-bold text-muted-foreground hover:bg-transparent"
            >
              今はしない
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // デスクトップの場合は洗練されたバナー
  return (
    <div className="
      fixed bottom-8 right-8 z-[var(--z-toast)]
      w-[380px] p-5 rounded-2xl
      bg-background/95 backdrop-blur-md text-foreground
      border border-border
      shadow-[0_20px_50px_rgba(0,0,0,0.15)]
      animate-in slide-in-from-bottom-8 duration-500
    ">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-inner">
              <Download className="h-6 w-6" />
            </div>

            <div>
              <p className="font-black text-base tracking-tight">
                アプリをインストール
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                快適な執筆体験をあなたのPCに
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="
              h-11 w-11 flex items-center justify-center rounded-full
              hover:bg-muted transition-all active:scale-90
            "
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 mt-1">
          <Button
            onClick={handleInstall}
            className="flex-1 font-bold rounded-lg shadow-sm"
            size="sm"
          >
            インストール
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="px-4 font-bold rounded-lg"
            size="sm"
          >
            後で
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-md">
          <Info className="h-3 w-3" />
          <span>設定からいつでも再表示できます</span>
        </div>
      </div>
    </div>
  )
}
