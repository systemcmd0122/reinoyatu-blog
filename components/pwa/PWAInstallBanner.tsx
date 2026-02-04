"use client"

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function PWAInstallBanner() {
  const { isInstallable, promptInstall } = usePWAInstall()
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // ローカルストレージから非表示設定を読み込み
    const isDismissed = localStorage.getItem('pwa-banner-dismissed')
    if (isDismissed) {
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    // インストール可能で、まだ非表示にされていない場合にバナーを表示
    if (isInstallable && !dismissed) {
      setShowBanner(true)
    }
  }, [isInstallable, dismissed])

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg animate-in slide-in-from-bottom">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Download className="h-6 w-6 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base">
              アプリをインストール
            </p>
            <p className="text-xs sm:text-sm opacity-90 truncate">
              ホーム画面に追加して、より快適に利用できます
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-background text-foreground rounded-md font-medium text-sm hover:bg-background/90 transition-colors whitespace-nowrap"
          >
            インストール
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}