# WebGPU ブラウザ内 LLM 推論（記事執筆 AI アシスト）

このドキュメントでは、`@mlc-ai/web-llm` による **ブラウザ内・オフライン LLM 推論** を使った記事執筆 AI アシスト機能の仕様・設計・モデル選定理由・パフォーマンス計測方法をまとめます。

## 1. 機能概要

- エディタツールバーの ✨ ボタン、またはスラッシュコマンド `/ai` から AI アシストパネルを開く
- 4 種類のアクション
  - **続きを書く** — カーソル位置から文章を続き生成し、ストリーミングでエディタに挿入
  - **文章を整える** — 選択範囲（未選択時は全文）を洗練された日本語へ書き換え
  - **要約する** — 本文を約 300 文字に要約して挿入
  - **見出し案を出す** — 本文に沿った見出しを 3〜6 個提案し、見出しノードとして挿入
- 生成は **Web Worker** 上で実行され、メインスレッド（エディタ操作・スクロール）を一切ブロックしない
- **WebGPU 非対応端末では AI 機能を無効化し、案内を表示**（クラウド AI へのフォールバックは廃止）
- 初回のみモデル（約 923MB）をダウンロードし、以降は **IndexedDB に永続キャッシュ**（再ダウンロード不要・オフライン可）

## 2. 採用モデルと選定理由

| モデル (q4f16_1) | 日本語品質 | DL サイズ | VRAM | コンテキスト | ライセンス | 判定 |
|--------|-----------|-----------|------|--------------|-----------|------|
| **Qwen3-1.7B-q4f16_1-MLC** | ◎ | **約 923MB** | 約 2.0GB | 4096 | Apache 2.0 | **採用** |
| Qwen3-4B-q4f16_1-MLC | ◎ 最高 | 約 2.1GB | 約 3.4GB | 4096 | Apache 2.0 | 非採用（>2GB） |
| Qwen2.5-1.5B / 3B | ○ | 0.8〜1.7GB | 2.0〜2.6GB | 4096 | Apache 2.0 | 次点 |
| Gemma-2-2B-it / Gemma-3-4B | △ | 1.4〜2.1GB | 2.2〜3.2GB | 4096 | Gemma | 非採用（日本語弱） |
| Llama-3.2-1B / 3B | △ | 0.7〜1.7GB | 1.5〜2.6GB | 4096 | Llama 3.2 | 非採用（日本語弱） |
| Phi-3.5-mini-3.8B | △ | 約 2.1GB | 2.6GB | 4096 | MIT | 非採用（日本語弱） |

> モデル ID は WebLLM 0.2.84 の `prebuiltAppConfig` に実在する `Qwen3-1.7B-q4f16_1-MLC`（base バリアント、conv_template `qwen3`、thinking 無効、コンテキスト 4096 固定）を採用。HF 上の `Qwen3-1.7B-Instruct-...` 系は prebuilt リストに無いため model_lib が対応しておらず不採用。

選定基準（優先順）:

1. **日本語の文章生成品質** — Qwen 系は多言語学習データ（特に日本語・中国語）が豊富で、1.7B ながら文法・文体が最も自然。Gemma / Llama / Phi は英語偏重で日本語が崩れやすい。
2. **ダウンロードサイズ** — 方針として「q4f16 量子化で 2GB 以下」。Qwen3-4B は約 2.1GB で超過。923MB ならモバイル回線でも実用的。
3. **コンテキスト 4096** — WebLLM の prebuilt 設定によりコンテキストは 4096 トークンに固定。記事本文（約 4000 文字までプロンプトに含める）を収められる。
4. **ライセンス** — Apache 2.0 は商用ブログサービスに制約なし。
5. **WebGPU での実績** — Qwen3 は web-llm の `prebuiltAppConfig` に含まれ動作実績が豊富。Gemma-3 等の hybrid attention 系は WebGPU 最適化が未成熟（TTFT が 10〜20 倍遅延する報告あり）で不採用。

> 高性能端末向けに `Qwen3-4B-q4f16_1-MLC` へ差し替えることも可能（`hooks/use-webllm.ts` の `WEBLLM_MODEL_ID` と `WEBLLM_MODEL_RECORD` を変更するだけ。VRAM 約 3.4GB 必要）。

### キャッシュ仕様

- **IndexedDB**（`cacheBackend: "indexeddb"`）を使用
- 一度ダウンロードしたモデル・WASM・トークナイザはブラウザの Storage API に永続化され、次回以降はキャッシュから即座にロード
- モデル変更時のみ再ダウンロードが発生する

> ⚠️ **Cache API は使わない**（実測の根拠）: WebLLM 既定の `cacheBackend: "cache"`（Cache Storage API）はブラウザのクォータが小さく、ディスク空きが少ない環境では **Qwen3-1.7B のダウンロードが約 92%（849MB/923MB）で `QuotaExceededError` になり「永遠にダウンロード中」に見える**。IndexedDB は同一オリジンのストレージクォータが大きく（約ディスク 60%）、ヘッドレス Chrome の検証で 924MB のダウンロードが 100% 完了することを確認済み。ハードディスクの空きが少ない場合は本機能に 1GB 以上必要。

## 3. アーキテクチャ

```
┌─────────────────────────────── ブラウザ ───────────────────────────────┐
│                                                                        │
│  メインスレッド                                                         │
│  ┌──────────────────────┐      ┌──────────────────────────────┐       │
│  │ RichTextEditor        │      │ AIAssistPanel                │       │
│  │  (Tiptap v3)          │◄────►│  - アクション選択            │       │
│  │  - ストリーミング挿入 │      │  - 進捗バー / 中断           │       │
│  │  - スラッシュコマンド │      │  - WebGPU ローカル推論       │       │
│  └──────────┬───────────┘      └───────────────┬──────────────┘       │
│             │       hooks/use-webllm             │                      │
│             │  （軽量クライアント + シングルトン） │                      │
│             │  postMessage（公式プロトコル）      │                      │
│  ┌──────────▼───────────────────────────────────▼──────────────┐       │
│  │  /workers/webllm.worker.js (public/ 配下の Web Worker)        │       │
│  │   WebWorkerMLCEngineHandler + MLCEngine                      │       │
│  │   ├─ ランタイム: jsdelivr CDN (+esm バンドル) から import     │       │
│  │   ├─ モデルダウンロード（IndexedDB）                        │       │
│  │   └─ WebGPU 推論（トークンストリーム）                        │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                        │
│  他機能（AI対話型エディタ / 編集サイドバー / デバッグページ）も          │
│  すべて hooks/use-webllm 経由。クラウド AI（Gemini）は使用しない。     │
└────────────────────────────────────────────────────────────────────────┘
```

### ファイル構成

| ファイル | 役割 |
|---------|------|
| `public/workers/webllm.worker.js` | WebLLM の Worker ハンドラー（推論はすべてここ。自己完結型） |
| `hooks/use-webllm.ts` | WebGPU 判定・軽量 Worker クライアント・シングルトン管理・ストリーミング生成・中断・計測・ライブメトリクス・GPU情報取得 |
| `components/blog/ai/AILiveStatus.tsx` | 生成中のライブステータス共通 UI（経過時間 / 速度 / 遅延案内 / GPU 負荷目安） |
| `components/blog/ai/GPUInfoLine.tsx` | GPU（アダプタ）情報・推定 VRAM・稼働状態の共通表示 |
| `components/blog/editor/ai/markdown.ts` | AI 出力の Markdown クリーニングと、エディタと同じ markdown-it による ProseMirror ノード変換 |
| `components/blog/editor/ai/AIAssistPanel.tsx` | パネル UI・4 アクション・進捗（WebGPU のみ） |
| `components/blog/editor/EditorToolbar.tsx` | ✨ AI ボタン（`open-ai-assist` イベント発火） |
| `components/blog/editor/suggestion.tsx` | `/ai` スラッシュコマンド 4 件 |
| `components/blog/editor/RichTextEditor.tsx` | パネルのマウント・イベント購読 |
| `components/blog/BlogAICreate.tsx` | AI 対話型エディタ（チャットで記事を作成） |
| `components/blog/editor/AIEditorActions.tsx` | 公開設定の AI アシスタント（改善 / タイトル / タグ / 要約） |
| `app/debug/ai/page.tsx` | ローカル AI の性能デバッグページ |

### Worker の配置とメインスレッド分離（重要）

- **`new Worker(new URL(...))` パターンは Turbopack（Next.js 16 の既定バンドラー）ではバンドルされない**。参照した `.ts` / `.js` が未バンドルのまま静的なメディアアセットとして配信され、`import "@mlc-ai/web-llm"` の解決に失敗する（[vercel/next.js discussion #59729](https://github.com/vercel/next.js/discussions/59729)）。
- そのため Worker は **`public/` 配下の自己完結型 ES Module** とし、WebLLM ランタイムを CDN から直接 import する（バンドラー非依存で dev / prod とも動作）。
  - `https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.84/+esm`（esbuild で依存を 1 ファイルにした ESM。WASM もインライン）
  - **CDN のバージョンは `package.json` の `@mlc-ai/web-llm` と常に同期させること**（型定義は npm パッケージから参照）
- **メインスレッドには WebLLM ランタイムを読み込まない**。公式クライアント（`CreateWebWorkerMLCEngine`）を import すると `lib/index.js`（約 6.5MB）がバンドルに混入するため、`hooks/use-webllm.ts` 内で公式のメッセージプロトコル（`lib/message.d.ts`）に沿った軽量クライアント（`WebLLMClient`）を実装している。
  - やり取りするメッセージ: `setAppConfig` / `reload` / `chatCompletionStreamInit` / `completionStreamNextChunk` / `interruptGenerate`、および `initProgressCallback` / `return` / `throw` 応答
  - モデルレコード（model / model_id / model_lib / vram_required_MB / overrides）は `WEBLLM_MODEL_RECORD` としてハードコード（`prebuiltAppConfig` の値に同期）

### ストリーミング挿入の仕組み

生成トークンをそのまま Markdown 文字列として積むのではなく、**ProseMirror のドキュメント内絶対位置を `node.nodeSize` の差分で前進**させながらノードを挿入する。

- 空行で段落を区切り、段落内の改行は `hardBreak` ノードへ変換
- ストリーミング中は `streamMarkdownToNodes` で行頭記号（`#` / `-` / `>` / `番号.`）からブロックを即時推定して表示
- **生成完了後に `markdownToNodes` で挿入範囲全体を再パースして置き換える確定処理を行う**（`cleanMarkdownOutput` で ``` ```markdown ``` フェンスや「改善後:」等のノイズも除去）
  - エディタと同じ `tiptap-markdown`（markdown-it）を使うため、`#` 見出し・箇条書き・引用・コードブロック・**太字** などが正しいノードになる
  - これにより「# 見出し」がテキストのまま残る、リストがバラバラになる等の Markdown 崩れバグを防止
- メインスレッドは `view.dispatch(tr)` のみで、推論は Worker 側で行われるため UI はフリーズしない
- 見出し案はストリーミング中は挿入せず、完了後に全文をパースして挿入

### 遅延時の明示的なフィードバック（ユーザー安心のための仕組み）

ローカル推論（WebGPU）は端末性能に依存するため、初回トークン（TTFT）に数秒〜数十秒かかることがある。以下の仕組みで「フリーズしていないこと」を UI に明示する。

- `hooks/use-webllm.ts` が **約 500ms ごとのライブメトリクス**（経過ミリ秒 / フェーズ `prefill`・`streaming` / トークン数 / 速度 tok/s）を発行
- 共通コンポーネント `AILiveStatus` がパネル・対話型エディタ・公開設定の 3 箇所で、点滅インジケータ + 経過タイマー（m:ss）+ 速度 + トークン数をライブ表示
- **初回トークンが 8 秒（`FIRST_TOKEN_SLOW_MS`）を超えると**「初回トークンに時間がかかっています。処理は継続中です」と明示
- **60 秒（`LONG_GENERATION_MS`）を超えると**より強い案内を表示（中断も誘導）
- プロンプト側も「見出し・箇条書き等の Markdown 記法を正しく使う」「コードフェンスで全体を囲まない」旨を追加し、MD 崩れ自体も抑制

### GPU 使用率・GPU 情報の表示

WebGPU は実際の GPU 使用率を公開する API を持たないため、以下の代替指標を表示する。

- `navigator.gpu.requestAdapter()` + `requestAdapterInfo()` から **GPU アダプタ名・ベンダー・アーキテクチャ**を取得し `GPUInfoLine` で表示
- 採用モデルの **推定 VRAM 使用量**（Qwen3-1.7B で約 2.0GB）を併記
- 生成中は「稼働中」の点滅表示と、**生成速度ベースの GPU 負荷バー**（`AILiveStatus`）で目安表示
  - ツールチップで「WebGPU は実際の GPU 使用率を公開しないため、生成速度を負荷の目安として表示しています」と正直に明示

### キャンセル（中断）

- `interruptGenerate` メッセージで Worker 内のデコードを即時停止
- 挿入済みの部分はそのまま保持（クリーンアップなし）

### プライバシー

- 記事の内容が **一切サーバーに送信されない**（ブラウザ内で完結。CDN へはモデルファイル取得のみ）
- クラウド AI（Gemini）は廃止済み。`hooks/use-ai.ts` と `app/api/ai/generate/route.ts` は削除された

## 4. パフォーマンス計測

`hooks/use-webllm.ts` の `generate()` 内で計測し、`console.info` とパネル内に表示する。

| 指標 | 説明 |
|------|------|
| TTFT | 生成開始から最初のトークンまでのミリ秒。プロンプトのプリフィル時間が支配的 |
| トークン/秒 | 生成速度。長い出力ほど安定値に近づく |

計測ログ例:

```ts
console.info("[WebGPU AI]", {
  model: "Qwen3-1.7B-q4f16_1-MLC",
  ttftMs: 1200,
  tokens: 300,
  elapsedMs: 8500,
  tokensPerSec: 35.3,
})
```

### 参考値（目安）

Qwen3-1.7B（q4f16_1）は WebGPU（デスクトップ GPU / 統合 GPU）でおよそ **20〜60 トークン/秒**、初回トークンまで **1〜5 秒** 程度。VRAM が確保できない場合はモデルロード時に失敗するため、エラー表示と再試行ボタンを設けている。

### モバイル端末について

- WebGPU 対応の Android（Chrome 最新）では動作可能だが、モデル約 923MB + WASM のダウンロードと VRAM 2GB が必要
- iPhone / iPad（Safari）は **WebGPU 非対応のため AI 機能を利用できない**（案内を表示し、機能を無効化）
- メモリ制約が厳しい端末ではモデルロードに失敗する可能性があり、エラー表示と再試行ボタンで対処する

## 5. 今後の改善候補

- ✅ **GPU 情報の表示**（`getGPUVendor` に相当）: `requestAdapterInfo()` による GPU 名・ベンダー表示と、生成速度ベースの GPU 負荷目安・稼働状態表示を実装済み
- ✅ **遅延時の明示的なフィードバック**: ライブメトリクス（経過時間 / tok/s / トークン数）と 8 秒・60 秒しきい値の遅延案内を実装済み
- ✅ **Markdown 崩れの防止**: エディタと同じ markdown-it で全文再パースする確定処理と出力クリーニングを実装済み
- モデル差し替え UI（1.7B ⇄ 4B）と `low_resource_required` を利用した自動選択
- `webllm.embeddings` を使った記事の要約・類似記事検索
- WebGPU 初回利用時の機能説明オンボーディング（ダウンロード容量の明示）
