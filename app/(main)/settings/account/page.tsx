import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AccountSettings from "@/components/settings/AccountSettings"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "アカウント設定",
  description: "SNS連携の設定やアカウントの管理を行うことができます。",
}

const AccountPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user || !user.email) {
    redirect("/login?next=/settings/account")
  }

  const identities = user.identities || []

  return <AccountSettings email={user.email} identities={identities} />
}

export default AccountPage
