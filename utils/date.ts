import { format, parseISO, isValid } from "date-fns"
import { ja } from "date-fns/locale"

/**
 * 日付文字列をJST形式でフォーマットする
 * @param dateString ISO形式の日付文字列
 * @returns フォーマットされた日付文字列
 */
export const formatJST = (dateString: string): string => {
  try {
    // 日付文字列のパース
    const date = parseISO(dateString)
    
    // 日付が有効かチェック
    if (!isValid(date)) {
      console.error("Invalid date string:", dateString)
      return "日付情報なし"
    }

    // 日付のフォーマット
    return format(date, "yyyy年MM月dd日 HH:mm", {
      locale: ja
    })
  } catch (error) {
    console.error("Date formatting error:", error)
    return "日付情報なし"
  }
}

/**
 * 相対的な時間表示を生成する（例：「3分前」「2時間前」など）
 * @param dateString ISO形式の日付文字列
 * @returns フォーマットされた相対時間文字列
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return "日付情報なし"
    }

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // 1分未満
    if (diffInSeconds < 60) {
      return "たった今"
    }
    // 1時間未満
    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分前`
    }
    // 24時間未満
    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}時間前`
    }
    // 30日未満
    if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}日前`
    }
    // それ以外は通常のフォーマット
    return formatJST(dateString)
  } catch (error) {
    console.error("Relative time formatting error:", error)
    return "日付情報なし"
  }
}

/**
 * 日付の比較用に標準化された形式を返す
 * @param dateString ISO形式の日付文字列
 * @returns YYYY-MM-DD形式の日付文字列
 */
export const getStandardizedDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return ""
    }
    return format(date, "yyyy-MM-dd")
  } catch (error) {
    console.error("Date standardization error:", error)
    return ""
  }
}

/**
 * ブログ記事用の標準的な日付表示を生成する
 * @param createdAt 作成日
 * @param updatedAt 更新日
 * @param isPublished 公開済みかどうか
 * @returns 表示用文字列
 */
export const formatBlogDate = (createdAt: string, updatedAt: string, isPublished: boolean): string => {
  if (!isPublished) {
    return `下書き (${formatRelativeTime(createdAt)})`
  }

  const created = parseISO(createdAt).getTime()
  const updated = parseISO(updatedAt).getTime()
  
  // 更新日が作成日より24時間以上後の場合は「更新」を表示
  const isSignificantUpdate = (updated - created) > 24 * 60 * 60 * 1000

  if (isSignificantUpdate) {
    return `${formatRelativeTime(updatedAt)}に更新`
  }

  return `${formatRelativeTime(createdAt)}に公開`
}

/**
 * 日付が現在から指定された日数以内かどうかをチェック
 * @param dateString ISO形式の日付文字列
 * @param days 日数
 * @returns boolean
 */
export const isWithinDays = (dateString: string, days: number): boolean => {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return false
    }

    const now = new Date()
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return diffInDays <= days
  } catch (error) {
    console.error("Date comparison error:", error)
    return false
  }
}

/**
 * 日付文字列をタイムスタンプに変換
 * @param dateString ISO形式の日付文字列
 * @returns number UNIXタイムスタンプ（ミリ秒）
 */
export const getTimestamp = (dateString: string): number => {
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return 0
    }
    return date.getTime()
  } catch (error) {
    console.error("Timestamp conversion error:", error)
    return 0
  }
}