import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProfileType } from "@/types"
import { Suspense } from "react"
import Profile from "@/components/settings/Profile"
import Loading from "@/app/loading"

const ProfilePage = async () => {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  let profile: ProfileType | null = null

  if (user) {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("プロフィールの取得中にエラーが発生しました:", error)
    }

    profile = profileData
  }

  if (!user || !profile) {
    redirect("/")
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 border-b pb-3">
          プロフィール設定
        </h1>
        <Profile profile={profile} />
      </div>
    </Suspense>
  )
}

export default ProfilePage