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
      prompt: string | AIMessage[],
      onProgress?: (partialText: string) => void
    ): Promise<string> => {
      setIsGenerating(true)
      setError(null)

      const controller = new AbortController()
      setAbortController(controller)

      // タイムアウト監視（90秒間応答がない、または全体の生成時間が長すぎる場合）
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 120000)

      let fullResponse = ""

      console.log(`[AI] Starting generation with model: ${DEFAULT_MODEL}`)
      try {
        // Puter.js API を呼び出し
        // 文字列またはメッセージ配列の両方に対応
        const options: any = {
          model: DEFAULT_MODEL,
          stream: !!onProgress,
        }

        const response = Array.isArray(prompt)
          ? await (puter.ai.chat as any)(prompt, false, options)
          : await (puter.ai.chat as any)(prompt, options);

        console.log("[AI] Response received, processing...")

        if (onProgress && response && typeof response !== "string" && Symbol.asyncIterator in Object(response)) {
          // ストリーミングモード
          try {
            // @ts-ignore: Puter.js の戻り値は stream: true の場合に AsyncIterable
            for await (const chunk of response) {
              if (controller.signal.aborted) {
                break
              }

              // デバッグ用: チャンクの中身を確認
              // console.log("[AI] Chunk received:", chunk)

              // textプロパティを持つオブジェクト、または文字列そのもの
              const content = typeof chunk === "string" ? chunk : (chunk?.text || "")

              if (content) {
                fullResponse += content
                onProgress(fullResponse)
              }
            }
            console.log("[AI] Streaming finished normally")
          } catch (streamErr) {
            console.error("[AI] Stream iteration error:", streamErr)
            // ストリームが途切れても、そこまでのレスポンスがあれば返す
          }
        } else if (response) {
          // 通常モード
          // Puter.js の非ストリームレスポンスは文字列または { message: { content: string } } の場合がある
          if (typeof response === "string") {
            fullResponse = response
          } else if (response && (response as any).message) {
            const msg = (response as any).message
            fullResponse = typeof msg === "string" ? msg : (msg.content || "")
          } else {
            fullResponse = response.toString()
          }
        }

        if (!fullResponse && !controller.signal.aborted) {
          throw new Error("AIからの応答が空でした。")
        }

        return fullResponse
      } catch (err: any) {
        if (err.name === "AbortError" || err.message === "中止されました" || controller.signal.aborted) {
          console.log("[AI] Generation aborted or timed out")
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
