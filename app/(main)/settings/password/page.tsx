import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import Password from "@/components/settings/Password"
import Loading from "@/app/loading"

const PasswordPage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect("/")
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 border-b pb-3">
          パスワード変更
        </h1>
        <Password />
      </div>
    </Suspense>
  )
}

export default PasswordPage