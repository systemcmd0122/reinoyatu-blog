"use client"

import { useState, useCallback } from "react"

const DEFAULT_MODEL = "gemini-3.5-flash"

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string
}

export interface UseAIReturn {
  isLoading: boolean
  error: string | null
  generateResponse: (
    prompt: string | AIMessage[],
    onProgress?: (partialText: string) => void
  ) => Promise<string>
  isGenerating: boolean
  downloadProgress: null
  initialized: boolean
  isSignedIn: boolean
  signIn: () => Promise<void>
  retry: () => void
  stop: () => void
}

export const useAI = (): UseAIReturn => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const generateResponse = useCallback(
    async (
      prompt: string | AIMessage[],
      onProgress?: (partialText: string) => void
    ): Promise<string> => {
      setIsGenerating(true)
      setError(null)

      const controller = new AbortController()
      setAbortController(controller)

      const timeoutId = setTimeout(() => controller.abort(), 300000)

      try {
        const messages = (Array.isArray(prompt) ? prompt : [
          { role: "user" as const, content: prompt },
        ]).map(m => ({
          role: m.role === "assistant" ? "model" as const : m.role === "system" ? "system" as const : "user" as const,
          content: m.content,
        }))

        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "不明なエラー" }))
          throw new Error(err.error || `HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("ストリームが利用できません")
        }

        const decoder = new TextDecoder()
        let fullText = ""

        if (onProgress) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value, { stream: true })
            if (text) {
              fullText += text
              onProgress(fullText)
            }
          }
        } else {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
          }
          const remaining = decoder.decode()
          if (remaining) fullText += remaining
        }

        if (!fullText && !controller.signal.aborted) {
          throw new Error("AIからの応答が空でした")
        }

        return fullText
      } catch (err: any) {
        if (err.name === "AbortError" || controller.signal.aborted) {
          return "（生成が中断されました）"
        }
        const errorMessage = err.message || "AIの応答生成中にエラーが発生しました"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        clearTimeout(timeoutId)
        setIsGenerating(false)
        setAbortController(null)
      }
    },
    []
  )

  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsGenerating(false)
    }
  }, [abortController])

  const retry = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading: false,
    error,
    generateResponse,
    isGenerating,
    downloadProgress: null,
    initialized: true,
    isSignedIn: true,
    signIn: async () => {},
    retry,
    stop,
  }
}
