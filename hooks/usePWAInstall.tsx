"use client"

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !((window as any).MSStream)
      setIsIOS(ios)

      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
        setIsInstalled(true)
      }
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // インストールバナーを自前で制御する場合、preventDefault()を呼び出して
      // ブラウザ標準のバナー（ミニインフォバー等）を抑制します。
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
      console.log("PWA: beforeinstallprompt event captured")
    }

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log("PWA: App installed successfully")
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn("PWA: No deferred prompt available")
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`PWA: User choice outcome: ${outcome}`)

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
        return true
      }
    } catch (err) {
      console.error("PWA: Error during promptInstall", err)
    }

    return false
  }

  return {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  }
}
