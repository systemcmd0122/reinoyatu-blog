import AccountSettings from "@/components/settings/AccountSettings"
import { Metadata } from "next"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "メールアドレス設定",
  description: "登録されているメールアドレスの確認や変更を行えます。",
}

const EmailPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user || !user.email) {
    redirect("/login?next=/settings/email")
  }

  const identities = user.identities || []

  return <AccountSettings email={user.email} identities={identities} />
}

export default EmailPage
