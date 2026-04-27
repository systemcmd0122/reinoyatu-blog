"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { LlmInference, FilesetResolver } from "@mediapipe/tasks-genai"

// モデルのURL。public/models/ フォルダに配置したパスを指定します。
const MODEL_URL = "/models/gemma-2b-it-gpu-int4.bin"

export interface UseGemmaReturn {
  isLoading: boolean
  error: string | null
  generateResponse: (prompt: string, onProgress?: (partialText: string) => void) => Promise<string>
  isGenerating: boolean
}

export const useGemma = (): UseGemmaReturn => {
  const [llmInference, setLlmInference] = useState<LlmInference | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializingRef = useRef(false)

  useEffect(() => {
    let inference: LlmInference | null = null;
    if (initializingRef.current || llmInference) return
    initializingRef.current = true

    const initLlm = async () => {
      try {
        // WASMファイルの読み込み先を指定。末尾にスラッシュが必要です。
        const genai = await FilesetResolver.forGenAiTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.27/wasm/"
        )

        inference = await LlmInference.createFromOptions(genai, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
          },
          maxTokens: 1024,
          topK: 40,
          temperature: 0.7,
          randomSeed: Math.floor(Math.random() * 1000),
        })

        setLlmInference(inference)
        setIsLoading(false)
      } catch (err) {
        console.error("Gemma initialization error:", err)
        setError("AIモデルの初期化に失敗しました。ハードウェアアクセラレーション（WebGPU/WebGL）が有効であることを確認してください。")
        setIsLoading(false)
      }
    }

    initLlm()

    return () => {
      if (inference) {
        inference.close()
      }
    }
  }, [llmInference])

  const generateResponse = useCallback(async (
    prompt: string,
    onProgress?: (partialText: string) => void
  ): Promise<string> => {
    if (!llmInference) {
      throw new Error("AIモデルが準備できていません。")
    }

    setIsGenerating(true)
    let fullResponse = ""

    try {
      // ストリーミングレスポンスの実装
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
      throw new Error("AIによる応答生成中にエラーが発生しました。")
    } finally {
      setIsGenerating(false)
    }
  }, [llmInference])

  return {
    isLoading,
    error,
    generateResponse,
    isGenerating
  }
}
