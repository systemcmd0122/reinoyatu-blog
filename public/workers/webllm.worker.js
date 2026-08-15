// WebLLM の推論エンジンを実行する Web Worker。
// モデルのダウンロード・WebGPU 上でのトークン生成はすべてここで行われる。
// これによりメインスレッド（React / Tiptap エディタ）は推論中もブロックされず、
// スクロールや入力などがフリーズしない。
//
// 設計メモ:
// - このファイルは public/workers/ に置かれた自己完結型の ES Module ワーカー。
//   Turbopack（Next.js 16 の既定）は `new Worker(new URL(...))` パターンを
//   バンドルせず、参照ファイルを静的なメディアアセットとしてそのまま配信する。
//   （https://github.com/vercel/next.js/discussions/59729）
//   そのためバンドラーに頼らず、WebLLM ランタイムを CDN から直接 import する。
// - CDN のバージョンは package.json の @mlc-ai/web-llm と常に同期させること
//   （型定義は npm パッケージから参照している）。
// - jsdelivr の +esm は依存をすべて1ファイルにバンドルしたもの。WASM は
//   内部にインラインされており、相対パス解決に依存しない。
//
// [修正] ランタイム整合性検証（TOFU）:
// - CDN 経由の動的 import はサプライチェーンリスクを伴う（CDN 側が侵害されると
//   任意コードが Worker 内で実行される）。jsdelivr の +esm バンドルには公式の
//   SRI ハッシュが提供されていないため、古典的な <script integrity="..."> は使えない。
// - そこで Trust On First Use（TOFU）方式を採用する:
//     1. スクリプト本体を fetch し、SHA-256 ハッシュを計算する。
//     2. Cache Storage に前回ロード時のハッシュが保存されていれば比較し、
//        不一致なら「改ざんの可能性あり」として起動を中止する。
//     3. 初回ロード時（保存済みハッシュが無い場合）は、そのハッシュを新たに記録する。
// - さらに強固にしたい場合は、監査済みのハッシュを KNOWN_GOOD_SHA256 に
//   手動で設定することで、TOFU をスキップして厳密な検証に切り替えられる
//   （`openssl dgst -sha256` 等でCDN配信物を事前に検証して埋め込むこと）。
// - 検証済みのソースコードは Blob URL 化してから import する（再フェッチしない）。
//
// - 起動シーケンス:
//   1. スクリプトは同期評価される（トップレベル await は使わない）。
//      即座に self.onmessage を登録するため、CDN 読み込み中に届いた
//      メッセージがブラウザのキューで失われることがない。
//   2. boot() が CDN からランタイムを検証つきで import し、ハンドラーを構築する。
//      完了後 `{kind:"booted"}` を送り、滞留していたメッセージを再生する。
//   3. 全 CDN が失敗した場合（整合性検証の失敗を含む）は `{kind:"fatal"}` を送り、
//      クライアントに無限ハングではなく明確なエラーを伝える。

const CDN_SOURCES = [
  // プライマリ: 依存を1ファイルにバンドル済み（WASM インライン）
  "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm",
  // フォールバック: esm.sh（依存を自動解決して配信）
  "https://esm.sh/@mlc-ai/web-llm@0.2.84",
]

// 監査済みのハッシュが分かっている場合はここに設定する（16進数のSHA-256）。
// 設定されていれば TOFU をスキップし、常にこの値と厳密に比較する。
// 例: "3f2e1a9c...":
const KNOWN_GOOD_SHA256 = {
  "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm": null,
  "https://esm.sh/@mlc-ai/web-llm@0.2.84": null,
}

const INTEGRITY_CACHE_NAME = "webllm-runtime-integrity-v1"

/** ハンドラーが構築されるまで届いたメッセージを貯める */
const pendingMessages = []

let handler = null
let booted = false

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function getPinnedHash(url) {
  try {
    const cache = await caches.open(INTEGRITY_CACHE_NAME)
    const res = await cache.match(url)
    if (!res) return null
    return await res.text()
  } catch {
    // Cache Storage が使えない環境（プライベートブラウジング等）では
    // 検証をスキップせず、常に「初回扱い」としてフェイルオープンしない。
    return null
  }
}

async function setPinnedHash(url, hash) {
  try {
    const cache = await caches.open(INTEGRITY_CACHE_NAME)
    await cache.put(url, new Response(hash))
  } catch (err) {
    console.warn("[webllm.worker] 整合性ハッシュの保存に失敗しました", err)
  }
}

/**
 * 指定 URL のスクリプトを fetch し、ハッシュ検証を行ってから import する。
 * - KNOWN_GOOD_SHA256 に値がある場合はそれと厳密比較（不一致なら即エラー）。
 * - ない場合は TOFU: 前回ハッシュと比較し、無ければ今回のハッシュを記録する。
 */
async function fetchAndVerify(url) {
  const res = await fetch(url, { mode: "cors" })
  if (!res.ok) {
    throw new Error(`ランタイムの取得に失敗しました (HTTP ${res.status}): ${url}`)
  }
  const buf = await res.arrayBuffer()
  const hash = await sha256Hex(buf)

  const known = KNOWN_GOOD_SHA256[url]
  if (known) {
    if (hash !== known) {
      throw new Error(
        `整合性検証エラー: ${url} のハッシュが監査済みの値と一致しません。` +
          `期待値=${known} 実際=${hash}（改ざんの可能性、または配信内容の変更）`
      )
    }
  } else {
    const pinned = await getPinnedHash(url)
    if (pinned === null) {
      // 初回ロード: このハッシュを「正」として記録する（TOFU）。
      await setPinnedHash(url, hash)
      console.info(
        `[webllm.worker] 初回ロードのためランタイムのハッシュを記録しました: ${url}`,
        hash
      )
    } else if (pinned !== hash) {
      throw new Error(
        `整合性検証エラー: ${url} の内容が前回ロード時から変化しています。` +
          `前回=${pinned} 今回=${hash}（改ざんの可能性）。` +
          `意図的な更新の場合は Cache Storage の "${INTEGRITY_CACHE_NAME}" をクリアしてください。`
      )
    }
  }

  const blob = new Blob([buf], { type: "text/javascript" })
  const blobUrl = URL.createObjectURL(blob)
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return await import(/* webpackIgnore: true */ blobUrl)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

async function boot() {
  let lastError = null
  for (const url of CDN_SOURCES) {
    try {
      const mod = await fetchAndVerify(url)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      handler = new mod.WebWorkerMLCEngineHandler()
      booted = true
      return
    } catch (err) {
      lastError = err
      console.error(`[webllm.worker] ランタイムの読み込みに失敗しました: ${url}`, err)
    }
  }
  postMessage({
    kind: "fatal",
    uuid: "",
    content: `WebLLM ランタイムを読み込めませんでした（整合性検証エラーの可能性を含む）: ${
      lastError?.message ?? lastError
    }`,
  })
}

self.onmessage = (msg) => {
  const data = msg?.data
  // 自前のシグナルはハンドラーに渡さない
  if (data?.kind === "booted" || data?.kind === "fatal" || data?.kind === "log") return
  if (handler) {
    handler.onmessage(msg)
  } else {
    pendingMessages.push(msg)
  }
}

boot().then(() => {
  if (!booted) return
  postMessage({ kind: "booted", uuid: "", content: null })
  while (pendingMessages.length > 0) {
    const msg = pendingMessages.shift()
    handler.onmessage(msg)
  }
})