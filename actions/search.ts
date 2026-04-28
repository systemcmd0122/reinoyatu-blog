"use server"

import axios from "axios"

/**
 * ウェブ検索を行い、結果をテキスト形式で返す
 *
 * 戦略（APIキー不要・安定動作）:
 *   1. DuckDuckGo Instant Answer API (api.duckduckgo.com) — 公式JSON API
 *   2. Wikipedia API (en.wikipedia.org / ja.wikipedia.org) — 公式JSON API
 *
 * どちらも認証不要・レートリミットなし・ボット検知なし。
 * HTMLスクレイピングは使用しない。
 */

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

interface SearchResult {
  title: string
  url: string
  snippet: string
}

// ──────────────────────────────────────────────
// DuckDuckGo Instant Answer API
// ──────────────────────────────────────────────

/**
 * DuckDuckGo Instant Answer API を呼び出す
 * 有名な概念・エンティティ（人物・企業・技術用語など）に強い。
 * 返り値: 検索結果の配列（最大5件）
 */
const searchDuckDuckGoInstant = async (query: string): Promise<SearchResult[]> => {
  const url = "https://api.duckduckgo.com/"

  const response = await axios.get(url, {
    params: {
      q: query,
      format: "json",
      no_html: "1",       // HTMLタグを除去
      no_redirect: "1",   // リダイレクトを防ぐ
      skip_disambig: "1", // 曖昧さ回避ページをスキップ
    },
    headers: {
      "Accept": "application/json",
      "Accept-Language": "ja,en;q=0.9",
    },
    timeout: 8000,
  })

  const data = response.data
  const results: SearchResult[] = []

  // AbstractText: Wikipediaなどからの要約テキスト
  if (data.AbstractText && data.AbstractText.length > 20) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || data.AbstractSource || "",
      snippet: data.AbstractText,
    })
  }

  // Answer: 計算結果・天気・変換など即時回答
  if (data.Answer && data.Answer.length > 0) {
    results.push({
      title: `即時回答: ${query}`,
      url: "",
      snippet: data.Answer,
    })
  }

  // RelatedTopics: 関連トピック（最大4件）
  const topics: any[] = data.RelatedTopics || []
  for (const topic of topics.slice(0, 4)) {
    if (topic.Text && topic.FirstURL) {
      results.push({
        title: topic.Text.split(" - ")[0]?.trim() || "関連トピック",
        url: topic.FirstURL,
        snippet: topic.Text,
      })
    } else if (topic.Topics) {
      // サブカテゴリが存在する場合、その中を展開
      for (const sub of (topic.Topics as any[]).slice(0, 2)) {
        if (sub.Text && sub.FirstURL) {
          results.push({
            title: sub.Text.split(" - ")[0]?.trim() || "関連トピック",
            url: sub.FirstURL,
            snippet: sub.Text,
          })
        }
      }
    }
  }

  // Infobox（追加情報）
  if (data.Infobox?.content) {
    const infoItems = data.Infobox.content
      .slice(0, 3)
      .map((item: any) => `${item.label}: ${item.value}`)
      .join(" / ")
    if (infoItems) {
      results.push({
        title: `詳細情報: ${data.Heading || query}`,
        url: data.AbstractURL || "",
        snippet: infoItems,
      })
    }
  }

  return results
}

// ──────────────────────────────────────────────
// Wikipedia API (日本語 → 英語フォールバック)
// ──────────────────────────────────────────────

/**
 * Wikipedia API を呼び出す
 * まず日本語版、取得できなければ英語版にフォールバック。
 * 返り値: 検索結果の配列（最大3件）
 */
const searchWikipedia = async (query: string): Promise<SearchResult[]> => {
  const results: SearchResult[] = []

  const endpoints = [
    { lang: "ja", base: "https://ja.wikipedia.org" },
    { lang: "en", base: "https://en.wikipedia.org" },
  ]

  for (const { lang, base } of endpoints) {
    try {
      // Step 1: OpenSearch でタイトル候補を取得
      const searchRes = await axios.get(`${base}/w/api.php`, {
        params: {
          action: "opensearch",
          search: query,
          limit: 3,
          namespace: 0,
          format: "json",
        },
        headers: { "Accept": "application/json" },
        timeout: 6000,
      })

      const [, titles, snippets, urls] = searchRes.data as [string, string[], string[], string[]]

      if (!titles || titles.length === 0) continue

      // Step 2: 各記事の冒頭テキストを取得
      const summaryRes = await axios.get(`${base}/w/api.php`, {
        params: {
          action: "query",
          prop: "extracts",
          exintro: true,        // 冒頭のみ
          explaintext: true,    // プレーンテキスト
          exsentences: 3,       // 最大3文
          titles: titles.slice(0, 2).join("|"),
          format: "json",
        },
        headers: { "Accept": "application/json" },
        timeout: 6000,
      })

      const pages = Object.values(summaryRes.data?.query?.pages || {}) as any[]

      for (let i = 0; i < Math.min(titles.length, 3); i++) {
        const title = titles[i]
        const url = urls[i]

        // extracts APIから対応するページを探す
        const page = pages.find((p: any) => p.title === title)
        const extract = page?.extract?.trim()

        // extractがあればそちらを、なければopensearchのsnippetを使う
        const snippet = extract
          ? extract.replace(/\n+/g, " ").substring(0, 300)
          : snippets[i] || ""

        if (title && url && snippet) {
          results.push({ title, url, snippet })
        }
      }

      // 日本語版で結果が取れたら英語版は試さない
      if (results.length > 0) break

    } catch (err: any) {
      console.warn(`Wikipedia ${lang} search error:`, err.message)
    }
  }

  return results
}

// ──────────────────────────────────────────────
// メイン関数
// ──────────────────────────────────────────────

/**
 * ウェブ検索を行い、結果をテキスト形式で返す。
 * DuckDuckGo Instant Answer API と Wikipedia API を組み合わせて使用。
 * どちらも無料・認証不要・安定した公式APIのため、ボット検知の心配がない。
 */
export const searchWeb = async (
  query: string
): Promise<{ content: string; error: string | null }> => {
  if (!query || query.trim().length === 0) {
    return { content: "", error: "クエリが空です。" }
  }

  const trimmedQuery = query.trim()
  const allResults: SearchResult[] = []
  const errors: string[] = []

  // ── DuckDuckGo Instant Answer API ──
  try {
    const ddgResults = await searchDuckDuckGoInstant(trimmedQuery)
    allResults.push(...ddgResults)
  } catch (err: any) {
    console.warn("DuckDuckGo Instant Answer error:", err.message)
    errors.push(`DuckDuckGo: ${err.message}`)
  }

  // ── Wikipedia API ──
  try {
    const wikiResults = await searchWikipedia(trimmedQuery)

    // DDGと重複するタイトルは除外して追加
    for (const r of wikiResults) {
      const isDuplicate = allResults.some(
        (existing) =>
          existing.title.toLowerCase() === r.title.toLowerCase() ||
          (existing.url && r.url && existing.url === r.url)
      )
      if (!isDuplicate) {
        allResults.push(r)
      }
    }
  } catch (err: any) {
    console.warn("Wikipedia search error:", err.message)
    errors.push(`Wikipedia: ${err.message}`)
  }

  // ── 結果の整形 ──
  if (allResults.length === 0) {
    const errorDetail = errors.length > 0 ? `\n詳細: ${errors.join(", ")}` : ""
    return {
      content: "",
      error: `「${trimmedQuery}」の検索結果が見つかりませんでした。別のキーワードでお試しください。${errorDetail}`,
    }
  }

  // 上位5件のみ使用
  const topResults = allResults.slice(0, 5)

  const formattedLines = topResults.map((r, i) => {
    const lines = [`[${i + 1}] ${r.title}`]
    if (r.url) lines.push(`URL: ${r.url}`)
    lines.push(`内容: ${r.snippet}`)
    return lines.join("\n")
  })

  const content = [
    `「${trimmedQuery}」の検索結果 (${topResults.length}件):`,
    "",
    ...formattedLines,
  ].join("\n")

  return { content, error: null }
}