import AppearanceSettings from "@/components/settings/AppearanceSettings"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "外観設定",
  description: "テーマカラー（ライト・ダークモード）やフォントなど、サイトの見た目をカスタマイズできます。",
}

const AppearancePage = () => {
  return <AppearanceSettings />
}

export default AppearancePage
