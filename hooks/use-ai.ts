"use client"

import { useState, useCallback, useEffect } from "react"
import { puter } from "@heyputer/puter.js"

// ────────────────────────────────────────────
// 定数
// ────────────────────────────────────────────
const DEFAULT_MODEL = "qwen/qwen3.6-plus"

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────
export interface DownloadProgress {
  total: number
  loaded: number
  percentage: number
}

export interface UseAIReturn {
  isLoading: boolean
  error: string | null
  generateResponse: (
    prompt: string,
    onProgress?: (partialText: string) => void
  ) => Promise<string>
  isGenerating: boolean
  downloadProgress: DownloadProgress | null // Puter.jsでは常にnull
  initialized: boolean
  retry: () => void
  stop: () => void
}

// ────────────────────────────────────────────
// フック本体
// ────────────────────────────────────────────
export const useAI = (): UseAIReturn => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Puter.js の初期化チェック（実際には自動で初期化されるが、
  // 以前のGemmaとの互換性のために一応管理）
  useEffect(() => {
    // Puterはブラウザ環境で動作する
    if (typeof window !== "undefined") {
      // ローディング画面がすぐ消えすぎないように少し待機
      const timer = setTimeout(() => {
        setInitialized(true)
        setIsLoading(false)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // ── テキスト生成 ──
  const generateResponse = useCallback(
    async (
      prompt: string,
      onProgress?: (partialText: string) => void
    ): Promise<string> => {
      setIsGenerating(true)
      setError(null)

      const controller = new AbortController()
      setAbortController(controller)

      // タイムアウト監視（60秒間応答がない、または全体の生成時間が長すぎる場合）
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 90000)

      let fullResponse = ""

      console.log(`[AI] Starting generation with model: ${DEFAULT_MODEL}`)
      try {
        // Puter.js API を呼び出し
        const response = await puter.ai.chat(prompt, {
          model: DEFAULT_MODEL,
          stream: !!onProgress,
        })

        console.log("[AI] Response received, processing...")

        if (onProgress && response && typeof response !== "string" && Symbol.asyncIterator in Object(response)) {
          // ストリーミングモード
          // @ts-ignore: Puter.js の戻り値は stream: true の場合に AsyncIterable
          for await (const chunk of response) {
            if (controller.signal.aborted) {
              throw new Error("中止されました")
            }
            const content = chunk?.text || ""
            fullResponse += content
            onProgress(fullResponse)
          }
          console.log("[AI] Streaming finished normally")
        } else if (response) {
          // 通常モード
          fullResponse = response.toString()
        }

        return fullResponse
      } catch (err: any) {
        if (err.name === "AbortError" || err.message === "中止されました") {
          console.log("[AI] Generation aborted")
          return fullResponse || "（生成が中断されました）"
        }
        console.error("[AI] Generation error:", err)
        const errorMessage = err.message || "AIの応答生成中にエラーが発生しました。"
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
    // Puterの場合は再試行でやることは特にないが、エラーをクリアする
  }, [])

  return {
    isLoading,
    error,
    generateResponse,
    isGenerating,
    downloadProgress: null,
    initialized,
    retry,
    stop,
  }
}
