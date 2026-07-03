"use client"

import { useState, useEffect } from "react"

export const useBlockerDetection = () => {
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const checkBlocker = () => {
      const dummy = document.createElement("div")
      dummy.className = "adsbox ads ad-unit google-ad"
      dummy.style.position = "absolute"
      dummy.style.left = "-1000px"
      dummy.style.top = "-1000px"
      document.body.appendChild(dummy)

      const isAdsElementHidden = dummy.offsetHeight === 0
      document.body.removeChild(dummy)

      if (isAdsElementHidden) {
        setIsBlocked(true)
      }
    }

    const timer = setTimeout(checkBlocker, 2000)
    return () => clearTimeout(timer)
  }, [])

  return isBlocked
}
