import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AiSettings from "@/components/settings/AiSettings"
import { Metadata } from "next"
import { getAiSettings } from "@/actions/user"

export const metadata: Metadata = {
  title: "AIを育てる - 設定",
  description: "AIの個性をカスタマイズして、あなた専用のアシスタントに成長させることができます。",
}

const AiSettingsPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect("/login?next=/settings/ai")
  }

  const res = await getAiSettings()

  return (
    <AiSettings
      initialSettings={res.success ? res.data : {}}
    />
  )
}

export default AiSettingsPage
