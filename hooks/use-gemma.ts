"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { LlmInference, FilesetResolver } from "@mediapipe/tasks-genai"

// ────────────────────────────────────────────
// 定数
// ────────────────────────────────────────────
const MODEL_URL =
  "https://huggingface.co/datasets/dev-bot/my-models/resolve/main/gemma-2b-it-gpu-int4.bin"
const CACHE_NAME = "gemma-model-cache-v1"

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────
export interface DownloadProgress {
  total: number
  loaded: number
  percentage: number
}

export interface UseGemmaReturn {
  isLoading: boolean
  error: string | null
  generateResponse: (
    prompt: string,
    onProgress?: (partialText: string) => void
  ) => Promise<string>
  isGenerating: boolean
  downloadProgress: DownloadProgress | null
  initialized: boolean
  retry: () => void
}

// ────────────────────────────────────────────
// グローバルシングルトン（ページ遷移をまたいでモデルを保持）
// ────────────────────────────────────────────
let globalLlmInference: LlmInference | null = null
let globalModelBuffer: Uint8Array | null = null
let initPromise: Promise<void> | null = null

// ────────────────────────────────────────────
// モデルダウンロード
// ────────────────────────────────────────────
const downloadModel = async (
  url: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<Uint8Array> => {
  // キャッシュから読み込む
  if (globalModelBuffer) {
    return globalModelBuffer
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(url)
    if (cachedResponse) {
      console.log("[Gemma] Loading model from cache...")
      const blob = await cachedResponse.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      globalModelBuffer = buffer
      return buffer
    }
  } catch (e) {
    console.warn("[Gemma] Cache API unavailable:", e)
  }

  // ネットワークからダウンロード
  console.log("[Gemma] Downloading model from network...")
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`モデルのダウンロードに失敗しました: ${response.status} ${response.statusText}`)
  }

  const contentLength = response.headers.get("content-length")
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("ストリームが利用できません")
  }

  let loaded = 0
  const chunks: Uint8Array[] = []

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (total > 0) {
      onProgress({
        total,
        loaded,
        percentage: Math.min(Math.round((loaded / total) * 100), 100),
      })
    }
  }

  // チャンクを結合
  const allChunks = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    allChunks.set(chunk, offset)
    offset += chunk.length
  }

  // キャッシュに保存
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(url, new Response(allChunks.slice()))
    console.log("[Gemma] Model saved to cache.")
  } catch (e) {
    console.warn("[Gemma] Failed to cache model:", e)
  }

  globalModelBuffer = allChunks
  return allChunks
}

// ────────────────────────────────────────────
// フック本体
// ────────────────────────────────────────────
export const useGemma = (): UseGemmaReturn => {
  const [isLoading, setIsLoading] = useState(!globalLlmInference)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [initialized, setInitialized] = useState(!!globalLlmInference)
  const [retryCount, setRetryCount] = useState(0)

  const isGeneratingRef = useRef(false)

  // ── 初期化 ──
  const initialize = useCallback(async () => {
    // すでに初期化済みならスキップ
    if (globalLlmInference) {
      setIsLoading(false)
      setInitialized(true)
      setError(null)
      return
    }

    // 他のインスタンスが初期化中なら待機
    if (initPromise) {
      try {
        await initPromise
        if (globalLlmInference) {
          setIsLoading(false)
          setInitialized(true)
          setError(null)
        }
      } catch {
        // エラーは initPromise 内で処理済み
      }
      return
    }

    setIsLoading(true)
    setError(null)
    setDownloadProgress(null)

    initPromise = (async () => {
      try {
        // WASMの読み込み
        const genai = await FilesetResolver.forGenAiTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.27/wasm"
        )

        // モデルデータの取得
        const modelData = await downloadModel(MODEL_URL, (progress) => {
          setDownloadProgress(progress)
        })

        // LlmInference の作成
        const inference = await LlmInference.createFromOptions(genai, {
          baseOptions: {
            modelAssetBuffer: modelData,
          },
          maxTokens: 2048,
          topK: 40,
          temperature: 0.8,
          randomSeed: Math.floor(Math.random() * 9999),
        })

        globalLlmInference = inference
        setInitialized(true)
        setIsLoading(false)
        setDownloadProgress(null)
        console.log("[Gemma] Initialized successfully.")
      } catch (err: any) {
        console.error("[Gemma] Initialization error:", err)
        initPromise = null // 再試行を許可

        let errorMessage = "AIモデルの初期化に失敗しました。"

        if (err.message?.includes("WebGPU") || err.message?.includes("WebGL")) {
          errorMessage =
            "ハードウェアアクセラレーション（WebGPU/WebGL）が無効です。ブラウザの設定を確認してください。"
        } else if (err.message?.includes("download") || err.message?.includes("fetch")) {
          errorMessage =
            "モデルのダウンロードに失敗しました。ネットワーク接続を確認してください。"
        } else if (err.message) {
          errorMessage = err.message
        }

        setError(errorMessage)
        setIsLoading(false)
        throw err
      }
    })()

    try {
      await initPromise
    } catch {
      // エラーはすでにsetErrorで設定済み
    }
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize, retryCount])

  // ── 再試行 ──
  const retry = useCallback(() => {
    initPromise = null
    globalLlmInference = null
    setError(null)
    setInitialized(false)
    setIsLoading(true)
    setRetryCount((c) => c + 1)
  }, [])

  // ── テキスト生成 ──
  const generateResponse = useCallback(
    async (
      prompt: string,
      onProgress?: (partialText: string) => void
    ): Promise<string> => {
      if (!globalLlmInference) {
        throw new Error("AIモデルが準備できていません。")
      }

      // 多重呼び出し防止（refで管理してレースコンディションを回避）
      if (isGeneratingRef.current) {
        throw new Error(
          "AIがまだ応答を生成しています。完了後に再度お試しください。"
        )
      }

      isGeneratingRef.current = true
      setIsGenerating(true)

      // プロンプトの長さを制限（Gemma 2b-it のトークン制限を考慮）
      const MAX_PROMPT_CHARS = 4000
      const safePrompt =
        prompt.length > MAX_PROMPT_CHARS
          ? prompt.substring(0, MAX_PROMPT_CHARS) +
            "\n...(入力が長すぎるため省略されました)\n<end_of_turn>\n<start_of_turn>model\n"
          : prompt

      let fullResponse = ""

      try {
        if (onProgress) {
          // ストリーミングモード
          await new Promise<void>((resolve, reject) => {
            globalLlmInference!
              .generateResponse(
                safePrompt,
                (partialText: string, done: boolean) => {
                  fullResponse += partialText
                  onProgress(fullResponse)
                  if (done) resolve()
                }
              )
              .catch(reject)
          })
        } else {
          // 通常モード
          fullResponse = await globalLlmInference!.generateResponse(safePrompt)
        }

        return fullResponse
      } catch (err: any) {
        console.error("[Gemma] Generation error:", err)

        // "Previous invocation" エラーの場合は少し待って再試行
        if (err.message?.includes("Previous invocation")) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          throw new Error(
            "AIがまだ処理中です。1秒待ってから再度お試しください。"
          )
        }

        throw new Error(
          "応答の生成中にエラーが発生しました。しばらく待ってから再度お試しください。"
        )
      } finally {
        isGeneratingRef.current = false
        setIsGenerating(false)
      }
    },
    []
  )

  return {
    isLoading,
    error,
    generateResponse,
    isGenerating,
    downloadProgress,
    initialized,
    retry,
  }
}