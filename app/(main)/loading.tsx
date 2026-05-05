import { BrandLoader } from "@/components/ui/BrandLoader"

/**
 * メインコンテンツエリア用のローディング
 */
export default function Loading() {
  return <BrandLoader subtext="Fetching stories" />
}
