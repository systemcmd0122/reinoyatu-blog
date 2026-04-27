"use server"

import axios from "axios"

/**
 * ウェブ検索を行い、結果をテキスト形式で返す
 * APIキーを必要としない方法として、DuckDuckGoの検索機能などを検討
 * 精度と安定性のために、SearXNGなどのメタ検索エンジンやスクレイピングを補助的に使用
 */
export const searchWeb = async (query: string): Promise<{ content: string; error: string | null }> => {
  if (!query) return { content: "", error: "クエリが空です。" }

  try {
    // DuckDuckGoのHTML版をスクレイピングする例（もっともシンプルで制限が少ない）
    // 注意: 本来はSERP APIなどを使うのが望ましいが、「APIを使わない」という制約を考慮
    const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const html = response.data

    // 簡易的なパース（正規表現を使用）
    const results: string[] = []
    // DuckDuckGo HTML版のクラス名に基づいた正規表現
    // class="result__a" がタイトルとリンク、class="result__snippet" が概要
    const resultRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

    let match
    let count = 0
    while ((match = resultRegex.exec(html)) !== null && count < 5) {
      const [_, url, title, snippet] = match
      // HTMLタグを除去し、実体参照をデコード（簡易）
      const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim()
      const cleanSnippet = snippet.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim()
      results.push(`タイトル: ${cleanTitle}\nURL: ${url}\n内容: ${cleanSnippet}\n---`)
      count++
    }

    if (results.length === 0) {
      return { content: "検索結果が見つかりませんでした。", error: null }
    }

    return {
      content: `最新の検索結果 (${query}):\n\n${results.join("\n")}`,
      error: null
    }
  } catch (error: any) {
    console.error("Web search error:", error)
    return { content: "", error: "ウェブ検索中にエラーが発生しました。" }
  }
}
