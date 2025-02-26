import { format } from "date-fns"
import { ja } from "date-fns/locale"

/**
 * 日付文字列をJST形式でフォーマットする
 * @param dateString ISO形式の日付文字列
 * @returns フォーマットされた日付文字列
 */
export const formatJST = (dateString: string) => {
  const date = new Date(dateString)
  return format(date, "yyyy/MM/dd HH:mm", { locale: ja })
}