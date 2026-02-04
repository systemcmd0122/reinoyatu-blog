"use client"

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check local storage for dismissal
    const isDismissed = localStorage.getItem('pwa-banner-dismissed')
    if (isDismissed) {
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    // Show banner if installable (Android/Chrome) or if it's iOS and not installed
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
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-xl bg-primary text-primary-foreground shadow-2xl animate-in slide-in-from-bottom-8 duration-300 md:left-auto md:right-8 md:bottom-8 md:max-w-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              {isIOS ? (
                <Share className="h-6 w-6" />
              ) : (
                <Download className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-bold text-base">アプリをインストール</p>
              <p className="text-xs opacity-90 leading-tight">
                {isIOS
                  ? "共有ボタンから「ホーム画面に追加」を選択してください"
                  : "ホーム画面に追加して、より快適に利用できます"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isIOS && (
          <button
            onClick={handleInstall}
            className="w-full py-2.5 bg-background text-foreground rounded-lg font-bold text-sm hover:bg-background/90 transition-all active:scale-[0.98] shadow-sm"
          >
            インストールする
          </button>
        )}
      </div>
    </div>
  )
}
