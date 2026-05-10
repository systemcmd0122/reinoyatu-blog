"use client"

import { useState, useEffect } from "react"

export const useBlockerDetection = () => {
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    // AdSense や Puter.js がブロックされているかチェック
    const checkBlocker = () => {
      // 1. AdSense のチェック
      const adsBlocked = typeof window !== "undefined" && !("adsbygoogle" in window)

      // 2. Puter.js のチェック (グローバルに展開されている場合)
      const puterBlocked = typeof window !== "undefined" && !("puter" in window)

      // 3. ダミーの広告要素を作成して、高さが0になるかチェックする手法
      const dummy = document.createElement("div")
      dummy.className = "adsbox ads ad-unit google-ad"
      dummy.style.position = "absolute"
      dummy.style.left = "-1000px"
      dummy.style.top = "-1000px"
      document.body.appendChild(dummy)

      const isAdsElementHidden = dummy.offsetHeight === 0
      document.body.removeChild(dummy)

      if (adsBlocked || puterBlocked || isAdsElementHidden) {
        setIsBlocked(true)
      }
    }

    // ページロード完了後に少し待ってからチェック
    const timer = setTimeout(checkBlocker, 2000)
    return () => clearTimeout(timer)
  }, [])

  return isBlocked
}
