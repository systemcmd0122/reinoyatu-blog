"use client"

import { useEffect } from "react"

const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5931540016126544"

export function AdSense() {
  useEffect(() => {
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return

    const script = document.createElement("script")
    script.async = true
    script.src = ADSENSE_SRC
    script.crossOrigin = "anonymous"
    script.onerror = () => {
      // Silently handle AdSense load failures (often blocked by client)
      console.warn("AdSense failed to load (possibly blocked):", script)
    }
    document.head.appendChild(script)
  }, [])

  return null
}
