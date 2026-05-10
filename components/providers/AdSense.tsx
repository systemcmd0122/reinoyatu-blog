"use client"

import Script from "next/script"

export function AdSense() {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5931540016126544"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onError={(e) => {
        // Silently handle AdSense load failures (often blocked by client)
        console.warn("AdSense failed to load (possibly blocked):", e)
      }}
    />
  )
}
