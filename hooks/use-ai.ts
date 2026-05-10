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
}

// ────────────────────────────────────────────
// フック本体
// ────────────────────────────────────────────
export const useAI = (): UseAIReturn => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Puter.js の初期化チェック（実際には自動で初期化されるが、
  // 以前のGemmaとの互換性のために一応管理）
  useEffect(() => {
    // Puterはブラウザ環境で動作する
    if (typeof window !== "undefined") {
      setInitialized(true)
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

      let fullResponse = ""

      try {
        // Puter.js API を呼び出し
        const response = await puter.ai.chat(prompt, {
          model: DEFAULT_MODEL,
          stream: !!onProgress,
        })

        if (onProgress && typeof response !== "string") {
          // ストリーミングモード
          // @ts-ignore: Puter.js の戻り値は stream: true の場合に AsyncIterable
          for await (const chunk of response) {
            const content = chunk?.text || ""
            fullResponse += content
            onProgress(fullResponse)
          }
        } else {
          // 通常モード
          fullResponse = response.toString()
        }

        return fullResponse
      } catch (err: any) {
        console.error("[AI] Generation error:", err)
        const errorMessage = err.message || "AIの応答生成中にエラーが発生しました。"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsGenerating(false)
      }
    },
    []
  )

  const retry = useCallback(() => {
    setError(null)
    // Puterの場合は再試行でやることは特にないが、エラーをクリアする
  }, [])

  return {
    isLoading: false, // APIベースなのでモデルロード待ちなどは基本不要
    error,
    generateResponse,
    isGenerating,
    downloadProgress: null,
    initialized,
    retry,
  }
}
