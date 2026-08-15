"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  AppConfig,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionRequestStreaming,
  InitProgressReport,
} from "@mlc-ai/web-llm"

// =====================================================================
// モデル選定（2026-08 時点、WebLLM 0.2.84 / modelVersion v0_2_84/base）
// =====================================================================
// 採用モデル: Qwen3-1.7B-q4f16_1-MLC（WebLLM の prebuiltAppConfig に含まれる
// base バリアント。conv_template "qwen3"、thinking は無効、コンテキスト 4096）
//
// 選定基準と比較結果:
// | モデル (q4f16_1)             | 日本語品質 | DL サイズ | VRAM    | ライセンス | 判定 |
// |-----------------------------|-----------|-----------|---------|-----------|------|
// | Qwen3-1.7B-q4f16_1-MLC      | ◎         | 約 923MB  | 2.0GB   | Apache 2.0 | 採用 |
// | Qwen3-4B-q4f16_1-MLC        | ◎ 最高    | 約 2.1GB  | 3.4GB   | Apache 2.0 | 非採用(>2GB) |
// | Qwen2.5-1.5B / 3B           | ○         | 0.8〜1.7GB | 2.0〜2.6GB | Apache 2.0 | 次点 |
// | Gemma-2-2B-it / Gemma-3-4B  | △         | 1.4〜2.1GB | 2.2〜3.2GB | Gemma  | 非採用(日本語弱) |
// | Llama-3.2-1B / 3B           | △         | 0.7〜1.7GB | 1.5〜2.6GB | Llama 3.2 | 非採用(日本語弱) |
// | Phi-3.5-mini(3.8B)          | △         | 約 2.1GB  | 2.6GB   | MIT      | 非採用(日本語弱) |
//
// 1. 日本語の文章生成品質: Qwen 系は多言語（特に日本語・中国語）の学習データが
//    豊富で、1.7B ながら日本語の文法・文体が最も自然。Gemma / Llama / Phi は
//    英語偏重で日本語が崩れやすい。
// 2. ダウンロードサイズ: 方針「q4f16 で 2GB 以下」。Qwen3-4B は約 2.1GB で超過。
//    923MB ならモバイル回線でも現実的。
// 3. コンテキスト: 4096 トークン（WebLLM の prebuilt 設定で 4096 に固定）。
//    記事の下書きをプロンプトに含める要件を満たす。
// 4. ライセンス: Apache 2.0 で商用ブログサービスに制約なし。
// 5. WebGPU での実績: prebuiltAppConfig に含まれ動作実績が豊富。Gemma-3 等の
//    hybrid attention 系は WebGPU 最適化が未成熟（TTFT が 10〜20 倍遅延）で不採用。
//
// 高性能端末向けの上位互換として Qwen3-4B-q4f16_1-MLC への差し替えも可能
// （WEBLLM_MODEL_ID を変更するだけ。ただし VRAM 約 3.4GB が必要）。
// =====================================================================

export const WEBLLM_MODEL_ID = "Qwen3-1.7B-q4f16_1-MLC"
// WASM 取得元がダウンした場合に切り替える予備モデルID（同一モデル・別ミラー）。
const WEBLLM_MODEL_ID_FALLBACK = "Qwen3-1.7B-q4f16_1-MLC-mirror"

export const WEBLLM_MODEL_INFO = {
  id: WEBLLM_MODEL_ID,
  name: "Qwen3 1.7B",
  params: "1.7B",
  quantization: "q4f16_1",
  downloadMB: 923,
  vramMB: 2036,
  contextWindow: 4096,
  license: "Apache 2.0",
  cacheBackend: "indexeddb", // docs/webgpu-ai.md 参照: Cache API は QuotaExceededError で「永遠にダウンロード中」になるため IndexedDB を使う
} as const

export type WebLLMStatus =
  | "idle" // 未ロード（モデル未ダウンロード）
  | "downloading" // モデル・WASM をダウンロード中
  | "ready" // ロード完了（キャッシュ済みなら即座にこの状態）
  | "generating" // 推論中
  | "error" // エラー

/**
 * 生成フェーズ。
 * - "prefill": 最初のトークンを受信する前（プロンプトの解析・GPU への積み込み中）。
 *               ここは TTFT（初回トークンまで）の待ち時間で、端末の性能により
 *               数秒〜数十秒かかる。UI で「動作中」であることを明示するために使う。
 * - "streaming": トークン生成中。
 */
export type WebLLMPhase = "prefill" | "streaming"

/** 初回トークンがここを超えて届かない場合、UI で「時間がかかっている」旨を案内する */
export const FIRST_TOKEN_SLOW_MS = 8000
/** 生成全体がこの時間を超えた場合、より強い案内を表示する */
export const LONG_GENERATION_MS = 60000

/** ブラウザから取得できる GPU（アダプタ）情報 */
export interface GPUInfo {
  vendor: string
  architecture: string
  device: string
  description: string
  vendorID: string
  deviceID: string
}

export interface WebLLMGenerateOptions {
  temperature?: number
  maxTokens?: number
  onProgress?: (fullText: string) => void
}

interface WebLLMReturn {
  /** WebGPU 対応状況。"checking" = 判定中 */
  webgpuSupport: "checking" | "supported" | "unsupported"
  status: WebLLMStatus
  /** モデルダウンロード進捗（0〜1） */
  progress: number
  progressText: string | null
  error: string | null
  /** 推論開始から最初のトークンまでのミリ秒（計測ログにも出力） */
  lastTTFT: number | null
  /** 推論速度（トークン/秒） */
  lastTokensPerSec: number | null
  /** [追加] 生成中の経過ミリ秒（約 500ms ごとに更新。生成していない間は最後の値） */
  elapsedMs: number | null
  /** [追加] 生成フェーズ。prefill = 初回トークン待機、streaming = 生成中 */
  phase: WebLLMPhase | null
  /** [追加] 生成中のトークン数（リアルタイム） */
  liveTokens: number | null
  /** [追加] 生成中の速度（トークン/秒、リアルタイム） */
  liveTps: number | null
  /** [追加] 端末の GPU（アダプタ）情報。取得不可なら null */
  gpuInfo: GPUInfo | null
  generate: (
    messages: ChatCompletionMessageParam[],
    options?: WebLLMGenerateOptions
  ) => Promise<string>
  stop: () => void
  resetError: () => void
  /** モデルを明示的にロード（進捗バー表示の事前トリガー用） */
  loadModel: () => Promise<void>
  /**
   * [追加] Worker とロード済みモデルを明示的に破棄する。
   * 全コンポーネント共有のシングルトンを解放するため、他の箇所で
   * 同時にモデルを使用していないことを確認してから呼び出すこと
   * （例: エディタ画面から離脱するときのクリーンアップ用）。
   */
  unload: () => Promise<void>
}

// ---------------------------------------------------------------------
// WebLLM Worker との軽量クライアント
// WebLLM の main スレッド用クライアント（CreateWebWorkerMLCEngine）は
// ランタイム本体（lib/index.js、約 6.5MB）をバンドルに引き込んでしまうため、
// ここでは公式のメッセージプロトコル（lib/message.d.ts）を直接実装する。
// 重いランタイムは Worker 側（public/workers/webllm.worker.js）だけで読まれる。
// ---------------------------------------------------------------------

// WebLLM 0.2.84 の prebuiltAppConfig に含まれる採用モデルのレコード。
// 更新時は node_modules/@mlc-ai/web-llm/lib/config.d.ts の modelVersion と
// prebuiltAppConfig の値に合わせて同期すること。
const WEBLLM_MODEL_RECORD = {
  model: "https://huggingface.co/mlc-ai/Qwen3-1.7B-q4f16_1-MLC",
  model_id: WEBLLM_MODEL_ID,
  model_lib:
    "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Qwen3-1.7B-q4f16_1_cs1k-webgpu.wasm",
  vram_required_MB: 2036.66,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
} as const

// [追加] raw.githubusercontent.com はレート制限がかかりやすく単一障害点になるため、
// jsdelivr の gh ミラー（cdn.jsdelivr.net/gh/...）を同一 wasm の予備ソースとして登録する。
// モデル本体（重み）は huggingface.co のまま変えない（huggingface CDN は十分安定しているため）。
const WEBLLM_MODEL_RECORD_FALLBACK = {
  model: "https://huggingface.co/mlc-ai/Qwen3-1.7B-q4f16_1-MLC",
  model_id: WEBLLM_MODEL_ID_FALLBACK,
  model_lib:
    "https://cdn.jsdelivr.net/gh/mlc-ai/binary-mlc-llm-libs@main/web-llm-models/v0_2_84/base/Qwen3-1.7B-q4f16_1_cs1k-webgpu.wasm",
  vram_required_MB: 2036.66,
  low_resource_required: true,
  overrides: { context_window_size: 4096 },
} as const

const WEBLLM_APP_CONFIG: AppConfig = {
  model_list: [WEBLLM_MODEL_RECORD, WEBLLM_MODEL_RECORD_FALLBACK],
  cacheBackend: "indexeddb",
}

interface WorkerRequest {
  kind: string
  uuid: string
  content: unknown
}

interface WorkerResponse {
  kind: "return" | "throw" | "initProgressCallback"
  uuid: string
  content: unknown
}

type PendingResult =
  | { rejected: true; content: unknown }
  | { rejected: false; content: unknown }

class WebLLMClient {
  private worker: Worker
  private pending = new Map<string, (result: PendingResult) => void>()
  private initProgressCallback: ((report: InitProgressReport) => void) | undefined
  /** [追加] 現在アクティブなモデルID。フォールバック使用時に primary から切り替わる。 */
  activeModelId: string = WEBLLM_MODEL_ID

  constructor(worker: Worker) {
    this.worker = worker
    worker.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data as WorkerResponse)
    }
  }

  private handleMessage(msg: WorkerResponse) {
    if (msg.kind === "initProgressCallback") {
      this.initProgressCallback?.(msg.content as InitProgressReport)
      return
    }
    const resolve = this.pending.get(msg.uuid)
    if (!resolve) return
    this.pending.delete(msg.uuid)
    if (msg.kind === "throw") {
      resolve({ rejected: true, content: msg.content })
    } else {
      resolve({ rejected: false, content: msg.content })
    }
  }

  setInitProgressCallback(cb?: (report: InitProgressReport) => void) {
    this.initProgressCallback = cb
  }

  /** エンジンにモデルリストとキャッシュ設定を通知（fire-and-forget） */
  setAppConfig(appConfig: AppConfig) {
    this.worker.postMessage({
      kind: "setAppConfig",
      uuid: crypto.randomUUID(),
      content: appConfig,
    })
  }

  private getPromise(msg: WorkerRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.pending.set(msg.uuid, (result) => {
        if (result.rejected) {
          reject(new Error(String(result.content)))
        } else {
          resolve(result.content)
        }
      })
      this.worker.postMessage(msg)
    })
  }

  /** モデルのロード（進捗は initProgressCallback で通知される） */
  reload(modelId: string) {
    return this.getPromise({
      kind: "reload",
      uuid: crypto.randomUUID(),
      content: { modelId: [modelId], chatOpts: undefined },
    })
  }

  /** ストリーミング生成の開始。Worker 側にチャンク生成器を用意する */
  chatCompletionStreamInit(request: ChatCompletionRequestStreaming) {
    return this.getPromise({
      kind: "chatCompletionStreamInit",
      uuid: crypto.randomUUID(),
      content: {
        request,
        selectedModelId: this.activeModelId,
        modelId: [this.activeModelId],
        chatOpts: undefined,
      },
    })
  }

  /** 次のチャンクを取得。完了時は null を返す */
  async nextChunk(): Promise<ChatCompletionChunk | null> {
    const ret = await this.getPromise({
      kind: "completionStreamNextChunk",
      uuid: crypto.randomUUID(),
      content: { selectedModelId: this.activeModelId },
    })
    // 生成器が終端に達すると void（null）が返る
    return typeof ret === "object" && ret !== null ? (ret as ChatCompletionChunk) : null
  }

  /** 生成を即時中断する（fire-and-forget） */
  interruptGenerate() {
    this.worker.postMessage({
      kind: "interruptGenerate",
      uuid: crypto.randomUUID(),
      content: null,
    })
  }

  /** [追加] Worker を終了させる。以後このクライアントは使用不可になる。 */
  terminate() {
    this.worker.terminate()
  }
}

// ---------------------------------------------------------------------
// モジュールレベルシングルトン
// 複数のコンポーネント（ツールバー / パネル / スラッシュコマンド）で
// エンジン・モデル・Worker を共有し、再ダウンロードを防ぐ。
// ---------------------------------------------------------------------

declare global {
  interface Navigator {
    gpu?: {
      requestAdapter?: () => Promise<unknown>
    }
  }
}

let enginePromise: Promise<WebLLMClient> | null = null
let lastReport: InitProgressReport | null = null
let supportPromise: Promise<boolean> | null = null

const progressListeners = new Set<(report: InitProgressReport) => void>()

const notifyProgress = (report: InitProgressReport) => {
  lastReport = report
  progressListeners.forEach((listener) => listener(report))
}

function checkWebGPUSupport(): Promise<boolean> {
  if (supportPromise) return supportPromise
  supportPromise = (async () => {
    if (typeof navigator === "undefined") return false
    const gpu = navigator.gpu
    if (!gpu || typeof gpu.requestAdapter !== "function") return false
    try {
      const adapter = await gpu.requestAdapter()
      return !!adapter
    } catch {
      return false
    }
  })()
  return supportPromise
}

let gpuInfoPromise: Promise<GPUInfo | null> | null = null

/**
 * [追加] GPU アダプタの情報（名前・ベンダー・アーキテクチャ等）を取得する。
 * requestAdapterInfo() は Chrome 114+ でサポート。古い実装は adapter.info に
 * フォールバックする。WebGPU 非対応・取得失敗時は null を返す。
 */
function queryGPUInfo(): Promise<GPUInfo | null> {
  if (gpuInfoPromise) return gpuInfoPromise
  gpuInfoPromise = (async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.gpu) return null
      if (typeof navigator.gpu.requestAdapter !== "function") return null
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) return null
      const adapterAny = adapter as unknown as {
        requestAdapterInfo?: () => Promise<{
          vendor?: string
          architecture?: string
          device?: string
          description?: string
          vendorID?: number
          deviceID?: number
        }>
        info?: {
          vendor?: string
          architecture?: string
          device?: string
          description?: string
          vendorID?: number
          deviceID?: number
        }
      }
      const info = adapterAny.requestAdapterInfo
        ? await adapterAny.requestAdapterInfo()
        : adapterAny.info
      if (!info) return null
      return {
        vendor: info.vendor || "",
        architecture: info.architecture || "",
        device: info.device || "",
        description: info.description || "",
        vendorID: info.vendorID ? `0x${info.vendorID.toString(16)}` : "",
        deviceID: info.deviceID ? `0x${info.deviceID.toString(16)}` : "",
      }
    } catch {
      return null
    }
  })()
  return gpuInfoPromise
}

async function createEngine(): Promise<WebLLMClient> {
  // 自己完結型の Worker（public/workers/webllm.worker.js）。
  // WebGPU 推論は Worker 上で実行され、メインスレッド（エディタ）をブロックしない。
  const worker = new Worker("/workers/webllm.worker.js", { type: "module" })

  const client = new WebLLMClient(worker)
  client.setInitProgressCallback(notifyProgress)
  client.setAppConfig(WEBLLM_APP_CONFIG)

  // [修正] WASM 取得元の単一障害点を解消するため、primary が失敗したら
  // 同一モデルの fallback ミラーで再試行する。
  try {
    await client.reload(WEBLLM_MODEL_ID)
    client.activeModelId = WEBLLM_MODEL_ID
  } catch (primaryErr) {
    console.warn(
      "[useWebLLM] primary モデルソースのロードに失敗、fallback ミラーで再試行します。",
      primaryErr
    )
    try {
      await client.reload(WEBLLM_MODEL_ID_FALLBACK)
      client.activeModelId = WEBLLM_MODEL_ID_FALLBACK
    } catch (fallbackErr) {
      // 両方失敗した場合は Worker を確実に終了させてリソースリークを防ぐ
      client.terminate()
      throw fallbackErr
    }
  }

  return client
}

function getEngine(): Promise<WebLLMClient> {
  if (enginePromise) return enginePromise
  enginePromise = createEngine().catch((err) => {
    // 失敗時は次回呼び出しで再試行できるようリセットする
    enginePromise = null
    throw err
  })
  return enginePromise
}

/** [追加] シングルトンエンジンを破棄し、Worker を終了させる。 */
async function disposeEngine(): Promise<void> {
  const current = enginePromise
  if (!current) return
  // 先に参照を外しておくことで、破棄中に来た呼び出しが新しいエンジンを作れるようにする
  enginePromise = null
  lastReport = null
  try {
    const engine = await current
    engine.terminate()
  } catch {
    // ロード自体に失敗していた場合は何もする必要がない
  }
}

// ---------------------------------------------------------------------

export function useWebLLM(): WebLLMReturn {
  const [webgpuSupport, setWebgpuSupport] = useState<"checking" | "supported" | "unsupported">("checking")
  const [status, setStatus] = useState<WebLLMStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastTTFT, setLastTTFT] = useState<number | null>(null)
  const [lastTokensPerSec, setLastTokensPerSec] = useState<number | null>(null)
  // [追加] 生成中のライブメトリクス（遅延時でも「動作中」を UI で伝えるため）
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [phase, setPhase] = useState<WebLLMPhase | null>(null)
  const [liveTokens, setLiveTokens] = useState<number | null>(null)
  const [liveTps, setLiveTps] = useState<number | null>(null)
  const [gpuInfo, setGpuInfo] = useState<GPUInfo | null>(null)

  const generatingRef = useRef(false)
  const stopRef = useRef<() => void>(() => {})
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedStartRef = useRef(0)

  // WebGPU 対応判定 + GPU 情報取得
  useEffect(() => {
    checkWebGPUSupport().then((ok) => {
      setWebgpuSupport(ok ? "supported" : "unsupported")
    })
    queryGPUInfo().then((info) => setGpuInfo(info))
  }, [])

  // モデルロード進捗の購読
  useEffect(() => {
    const listener = (report: InitProgressReport) => {
      setProgress(report.progress)
      setProgressText(report.text || null)
      if (report.progress >= 1) {
        setStatus("ready")
      } else {
        // [修正] 依存配列を空にした useEffect 内でマウント時の status を直接
        // 参照すると、常に初期値（"idle"）を見続ける古いクロージャになり、
        // 「生成中に進捗イベントが来ると downloading に戻ってしまう」バグが
        // 起きていた。関数型更新にすることで常に最新の status を見るようにする。
        setStatus((prev) => (prev === "generating" ? prev : "downloading"))
      }
    }
    progressListeners.add(listener)
    if (lastReport) listener(lastReport)
    return () => {
      progressListeners.delete(listener)
    }
  }, [])

  const loadModel = useCallback(async () => {
    setError(null)
    try {
      setStatus("downloading")
      await getEngine()
      setStatus("ready")
      setProgress(1)
    } catch (err: any) {
      const msg = err?.message || "モデルの読み込みに失敗しました"
      setError(msg)
      setStatus("error")
      throw new Error(msg)
    }
  }, [])

  const generate = useCallback(
    async (
      messages: ChatCompletionMessageParam[],
      options?: WebLLMGenerateOptions
    ): Promise<string> => {
      if (generatingRef.current) {
        throw new Error("既に生成中です。")
      }
      generatingRef.current = true
      setError(null)

      // モデル未ロードの場合は下の getEngine() 内でダウンロードが発生する。
      // その間 status を "generating" に変更しない（エンジン取得後に設定する）
      // ことで、ダウンロード進捗（"downloading"）を正しく表示し、
      // 「初回トークン生成中」という誤解やダウンロード時間の計測混入を避ける。
      let cancelled = false
      let ttft = 0
      let tokenCount = 0
      let fullText = ""

      // [追加] 約 500ms ごとに経過時間・速度を UI へ反映する。
      // 最初のトークンが遅い場合でも「動作中」であることを画面で伝える。
      const startTick = () => {
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = setInterval(() => {
          const elapsed = performance.now() - elapsedStartRef.current
          setElapsedMs(elapsed)
          setPhase(ttft ? "streaming" : "prefill")
          setLiveTokens(tokenCount)
          setLiveTps(
            elapsed > 0 && tokenCount > 0
              ? Math.round((tokenCount / (elapsed / 1000)) * 10) / 10
              : null
          )
        }, 500)
      }
      const clearTick = () => {
        if (tickRef.current) {
          clearInterval(tickRef.current)
          tickRef.current = null
        }
      }

      try {
        const engine = await getEngine()

        // エンジン準備完了時点から計測・表示を開始する
        // （モデルダウンロード時間を TTFT / 経過時間に含めない）。
        setStatus("generating")
        setElapsedMs(0)
        setPhase("prefill")
        setLiveTokens(0)
        setLiveTps(null)
        const t0 = performance.now()
        elapsedStartRef.current = t0
        startTick()

        const request: ChatCompletionRequestStreaming = {
          messages,
          temperature: options?.temperature ?? 0.7,
          top_p: 0.9,
          max_tokens: options?.maxTokens ?? 1024,
          stream: true,
          stream_options: { include_usage: true },
        }

        await engine.chatCompletionStreamInit(request)

        stopRef.current = () => {
          cancelled = true
          engine.interruptGenerate()
        }

        while (true) {
          if (cancelled) break
          const chunk = await engine.nextChunk()
          if (!chunk) break
          const delta = chunk.choices?.[0]?.delta?.content ?? ""
          if (delta) {
            if (!ttft) ttft = performance.now() - t0
            tokenCount += 1
            fullText += delta
            options?.onProgress?.(fullText)
          }
          if (chunk.usage?.completion_tokens) {
            tokenCount = chunk.usage.completion_tokens
          }
        }

        if (!fullText && !cancelled) {
          throw new Error("モデルの応答が空でした。")
        }

        // パフォーマンス計測（初回トークンまでのレイテンシ / 速度）
        const elapsed = performance.now() - t0
        const tps = elapsed > 0 ? Math.round((tokenCount / (elapsed / 1000)) * 10) / 10 : 0
        setLastTTFT(Math.round(ttft))
        setLastTokensPerSec(tps)
        setElapsedMs(elapsed)
        setPhase(ttft ? "streaming" : null)
        setLiveTokens(tokenCount)
        setLiveTps(tps)
        console.info("[WebGPU AI]", {
          model: engine.activeModelId,
          ttftMs: Math.round(ttft),
          tokens: tokenCount,
          elapsedMs: Math.round(elapsed),
          tokensPerSec: tps,
        })

        return fullText
      } catch (err: any) {
        if (cancelled) return ""
        const msg = err?.message || "推論中にエラーが発生しました。"
        setError(msg)
        setStatus("error")
        throw new Error(msg)
      } finally {
        generatingRef.current = false
        stopRef.current = () => {}
        clearTick()
        if (!cancelled) setStatus("ready")
      }
    },
    []
  )

  const stop = useCallback(() => {
    stopRef.current()
  }, [])

  const resetError = useCallback(() => {
    setError(null)
    setStatus((prev) => (prev === "error" ? "idle" : prev))
  }, [])

  // [追加] Worker とモデルを明示的に解放する。
  // シングルトン共有のため、他コンポーネントが使用中でないことを
  // 呼び出し側で確認すること（例: エディタのアンマウント時など）。
  const unload = useCallback(async () => {
    if (generatingRef.current) {
      stopRef.current()
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    await disposeEngine()
    setStatus("idle")
    setProgress(0)
    setProgressText(null)
    setElapsedMs(null)
    setPhase(null)
    setLiveTokens(null)
    setLiveTps(null)
  }, [])

  return {
    webgpuSupport,
    status,
    progress,
    progressText,
    error,
    lastTTFT,
    lastTokensPerSec,
    elapsedMs,
    phase,
    liveTokens,
    liveTps,
    gpuInfo,
    generate,
    stop,
    resetError,
    loadModel,
    unload,
  }
}