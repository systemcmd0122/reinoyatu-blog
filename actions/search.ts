"use server"

import axios from "axios"

/**
 * ウェブ検索を行い、結果をテキスト形式で返す
 * APIキーを必要としない方法として、DuckDuckGoの検索機能などを検討
 * 精度と安定性のために、SearXNGなどのメタ検索エンジンやスクレイピングを補助的に使用
 */
export const searchWeb = async (query: string): Promise<{ content: string; error: string | null }> => {
  if (!query) return { content: "", error: "クエリが空です。" }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
  ]

  const getRandomUA = () => userAgents[Math.floor(Math.random() * userAgents.length)]

  // 複数のエンドポイントを試す
  const endpoints = [
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
  ]

  for (const url of endpoints) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
          'DNT': '1',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 10000
      })

      const html = response.data

      // ボット検知（anomaly）のチェック
      if (html.includes('anomaly') || html.includes('Unfortunately, bots use DuckDuckGo too')) {
        console.warn(`DuckDuckGo blocked request at ${url}. Trying next endpoint...`)
        continue
      }

      const results: string[] = []

      // より堅牢な正規表現
      // 1. result__title または result__a を探す
      // 2. その後の snippet を探す
      const resultBlocks = html.split(/class="[^"]*result[^"]*"/).slice(1)

      for (const block of resultBlocks.slice(0, 5)) {
        // タイトルとURL
        const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
        // 概要 (aタグの場合とdivタグの場合がある)
        const snippetMatch = block.match(/<(?:a|div)[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/)

        if (titleMatch) {
          const rawUrl = titleMatch[1]
          // DDGのURLリダイレクトを解除 ( /l/?uddg=... )
          let cleanUrl = rawUrl
          if (rawUrl.includes('uddg=')) {
            try {
              const urlParams = new URLSearchParams(rawUrl.split('?')[1])
              cleanUrl = urlParams.get('uddg') || rawUrl
            } catch (e) {}
          }

          const cleanTitle = titleMatch[2].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
          const cleanSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim() : "概要なし"

          if (cleanTitle) {
            results.push(`タイトル: ${cleanTitle}\nURL: ${cleanUrl}\n内容: ${cleanSnippet}\n---`)
          }
        }
      }

      if (results.length > 0) {
        return {
          content: `最新の検索結果 (${query}):\n\n${results.join("\n")}`,
          error: null
        }
      }
    } catch (error: any) {
      console.error(`Search error at ${url}:`, error.message)
      // 次のエンドポイントへ
    }
  }

  return {
    content: "",
    error: "ウェブ検索の結果を取得できませんでした。時間をおいて再度お試しいただくか、別のキーワードでお試しください。"
  }
}
