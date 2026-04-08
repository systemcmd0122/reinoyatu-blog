import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AppearanceSettings from "@/components/settings/AppearanceSettings"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "外観設定",
  description: "テーマカラー（ライト・ダークモード）やフォントなど、サイトの見た目をカスタマイズできます。",
}

const AppearancePage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user || !user.email) {
    redirect("/login?next=/settings/appearance")
  }

  const identities = user.identities || []

  return <AppearanceSettings email={user.email} identities={identities} />
}

export default AppearancePage
