/**
 * タイトルからURL安全なスラッグを生成
 */
export function generateSlug(title: string): string {
  if (!title) return ""

  return title
    .toLowerCase()
    .trim()
    // 日本語・英数字・ハイフンを残し、その他を除去
    .replace(/[^\w\u3040-\u9fff\u30a0-\u30ff\u3400-\u9fff-]/g, "-")
    // 連続ハイフンを1つに
    .replace(/-+/g, "-")
    // 先頭・末尾のハイフンを除去
    .replace(/^-+|-+$/g, "")
    // 末尾にランダムな短いサフィックスを追加（重複防止）
    + "-" + Math.random().toString(36).substring(2, 6)
}

/**
 * スラッグが有効かチェック
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9\u3040-\u9fff\u30a0-\u30ff\u3400-\u9fff]+(-[a-z0-9\u3040-\u9fff\u30a0-\u30ff\u3400-\u9fff]+)*$/.test(slug)
}
