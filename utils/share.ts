import { toast } from "sonner"

interface ShareOptions {
  title?: string
  text?: string
  url: string
}

/**
 * 汎用的な共有機能
 * navigator.shareが使える場合はそれを使用し、使えない場合はクリップボードにコピーする
 */
export const shareContent = async (options: ShareOptions) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title || "RY - 例のヤツ",
        text: options.text,
        url: options.url,
      })
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Sharing failed", error)
        copyToClipboard(options.url)
      }
    }
  } else {
    copyToClipboard(options.url)
  }
}

/**
 * クリップボードにコピーする補助関数
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("リンクをクリップボードにコピーしました")
  } catch (error) {
    console.error("Clipboard copy failed", error)
    toast.error("リンクのコピーに失敗しました")
  }
}
