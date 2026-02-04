"use client"

import { useState, useEffect, useCallback } from "react"

export type ViewMode = "card" | "list" | "compact" | "magazine" | "text"

const STORAGE_KEY = "blog-view-mode"

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY) as ViewMode
    if (savedMode && ["card", "list", "compact", "magazine", "text"].includes(savedMode)) {
      setViewMode(savedMode)
    }
    setIsMounted(true)
  }, [])

  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  return {
    viewMode: isMounted ? viewMode : "list",
    changeViewMode,
    isMounted,
  }
}
