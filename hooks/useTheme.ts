// hooks/useTheme.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useEffect } from "react"
import { Theme } from "@/types/theme"

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-store",
    }
  )
)

export const useTheme = () => {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return { theme, setTheme }
}