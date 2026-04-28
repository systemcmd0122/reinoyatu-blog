"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { LlmInference, FilesetResolver } from "@mediapipe/tasks-genai"

// モデルのURL。
const MODEL_URL = "https://huggingface.co/datasets/dev-bot/my-models/resolve/main/gemma-2b-it-gpu-int4.bin"

export interface DownloadProgress {
  total: number
  loaded: number
  percentage: number
}

export interface UseGemmaReturn {
  isLoading: boolean
  error: string | null
  generateResponse: (prompt: string, onProgress?: (partialText: string) => void) => Promise<string>
  isGenerating: boolean
  downloadProgress: DownloadProgress | null
  initialized: boolean
}

export const useGemma = (): UseGemmaReturn => {
  const [llmInference, setLlmInference] = useState<LlmInference | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [initialized, setInitialized] = useState(false)

  const initializingRef = useRef(false)
  const modelBufferRef = useRef<Uint8Array | null>(null)

  const downloadModel = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to download model: ${response.statusText}`)

    const contentLength = response.headers.get("content-length")
    const total = contentLength ? parseInt(contentLength, 10) : 0

    const reader = response.body?.getReader()
    if (!reader) throw new Error("ReadableStream not supported")

    let loaded = 0
    const chunks: Uint8Array[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      loaded += value.length

      if (total > 0) {
        setDownloadProgress({
          total,
          loaded,
          percentage: Math.round((loaded / total) * 100)
        })
      }
    }

    const allChunks = new Uint8Array(loaded)
    let offset = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, offset)
      offset += chunk.length
    }

    return allChunks
  }

  useEffect(() => {
    if (initializingRef.current || llmInference) return
    initializingRef.current = true

    const initLlm = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // WASMファイルの読み込み先を指定 (末尾のスラッシュなし)
        const genai = await FilesetResolver.forGenAiTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.27/wasm"
        )

        // モデルを個別にダウンロードして進捗を表示
        let modelData: Uint8Array
        if (!modelBufferRef.current) {
          modelData = await downloadModel(MODEL_URL)
          modelBufferRef.current = modelData
        } else {
          modelData = modelBufferRef.current
        }

        const inference = await LlmInference.createFromOptions(genai, {
          baseOptions: {
            modelAssetBuffer: modelData,
          },
          maxTokens: 1024,
          topK: 40,
          temperature: 0.7,
          randomSeed: Math.floor(Math.random() * 1000),
        })

        setLlmInference(inference)
        setInitialized(true)
        setIsLoading(false)
      } catch (err) {
        console.error("Gemma initialization error:", err)
        setError(err instanceof Error ? err.message : "AIモデルの初期化に失敗しました。ハードウェアアクセラレーション（WebGPU/WebGL）が有効であることを確認してください。")
        setIsLoading(false)
        initializingRef.current = false // リトライを可能にする
      }
    }

    initLlm()

    return () => {
      // Note: グローバルに保持したい場合はここでのcloseは避けるべきかもしれないが、
      // このフックがアンマウントされる際のクリーンアップとして。
      // BlogEditorなど上位で保持されている場合はここに来ない。
    }
  }, [llmInference])

  const generateResponse = useCallback(async (
    prompt: string,
    onProgress?: (partialText: string) => void
  ): Promise<string> => {
    if (!llmInference) {
      throw new Error("AIモデルが準備できていません。")
    }

    if (isGenerating) {
      throw new Error("前の応答を生成中です。しばらくお待ちください。")
    }

    setIsGenerating(true)
    let fullResponse = ""

    try {
      if (onProgress) {
        await llmInference.generateResponse(prompt, (partialText, done) => {
          fullResponse += partialText
          onProgress(fullResponse)
        })
      } else {
        fullResponse = await llmInference.generateResponse(prompt)
      }

      return fullResponse
    } catch (err) {
      console.error("Gemma generation error:", err)
      // 特定のエラーメッセージの場合、より親切なメッセージを投げる
      const errorMsg = err instanceof Error ? err.message : ""
      if (errorMsg.includes("Previous invocation")) {
        throw new Error("AIがまだ前の質問を処理しています。少し待ってから再度お試しください。")
      }
      throw new Error("AIによる応答生成中にエラーが発生しました。しばらく時間を置いてから再度お試しください。")
    } finally {
      setIsGenerating(false)
    }
  }, [llmInference, isGenerating])

  return {
    isLoading,
    error,
    generateResponse,
    isGenerating,
    downloadProgress,
    initialized
  }
}
