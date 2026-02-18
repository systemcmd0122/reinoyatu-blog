import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AccountSettings from "@/components/settings/AccountSettings"

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
