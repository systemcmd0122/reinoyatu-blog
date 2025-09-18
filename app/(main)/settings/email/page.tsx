import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Email from "@/components/settings/Email"

const EmailPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user || !user.email) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-3">
        メールアドレス変更
      </h1>
      <Email email={user.email} />
    </div>
  )
}

export default EmailPage