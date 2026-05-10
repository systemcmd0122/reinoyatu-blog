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
  isSignedIn: boolean
  signIn: () => Promise<void>
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
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Puter.js の初期化 & 認証チェック
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkStatus = async () => {
        try {
          const authenticated = await puter.auth.isSignedIn()
          setIsSignedIn(authenticated)
        } catch (err) {
          console.error("[AI] Error checking Puter auth status:", err)
        } finally {
          setInitialized(true)
          setIsLoading(false)
        }
      }

      // 少し遅延させて初期化（UI演出のため）
      const timer = setTimeout(checkStatus, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const signIn = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      // Puter.js の signIn はポップアップを使用するため、
      // ユーザーの直接の操作（クリックイベント等）の中で呼び出される必要がある
      console.log("[AI] Attempting Puter sign-in...");
      await puter.auth.signIn()
      const authenticated = await puter.auth.isSignedIn()
      setIsSignedIn(authenticated)
      console.log("[AI] Puter sign-in status:", authenticated);
    } catch (err: any) {
      console.error("[AI] Puter sign-in error:", err)
      // ポップアップブロックなどで失敗した場合の対処
      const isPopupError =
        err?.message?.includes("popup") ||
        err?.message?.includes("closed") ||
        err?.message?.includes("blocked") ||
        !err?.message ||
        err === null;

      const message = isPopupError
        ? "ポップアップがブロックされたか、サインインがキャンセルされました。広告ブロッカー（AdBlockなど）をオフにし、ブラウザの設定でポップアップを許可してください。"
        : (err?.message || "サインインに失敗しました。");

      setError(message);
      throw new Error(message);
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

      // タイムアウト監視（300秒間：長文生成に対応するため延長）
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 300000)

      let fullResponse = ""

      console.log(`[AI] Starting generation with model: ${DEFAULT_MODEL}`)
      try {
        // ブラウザ環境チェック
        if (typeof window === "undefined") {
          throw new Error("クライアントサイドでのみ実行可能です。")
        }

        // 認証チェック
        let authenticated = false;
        try {
          authenticated = await puter.auth.isSignedIn()
        } catch (authCheckErr) {
          console.warn("[AI] Auth check failed, assuming not signed in:", authCheckErr)
        }

        if (!authenticated) {
          console.log("[AI] User not signed in to Puter, triggering sign-in...")
          try {
            await signIn()
          } catch (signInErr: any) {
            // signIn内でもエラーハンドリングしているが、ここでもキャッチして生成を中断する
            throw new Error(signInErr.message || "サインインが必要です。")
          }
        }

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
    isSignedIn,
    signIn,
    retry,
    stop,
  }
}
