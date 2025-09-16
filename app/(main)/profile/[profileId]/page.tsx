import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import UserProfile from "@/components/profile/UserProfile"

const ProfilePage = async ({
  params,
}: {
  params: { profileId: string }
}) => {
  const supabase = createClient()

  // セッション情報を取得
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // プロフィール情報を取得
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      introduce,
      avatar_url,
      email,
      website,
      created_at,
      social_links,
      blogs (
        id,
        title,
        created_at
      )
    `)
    .eq("id", params.profileId)
    .single()

  if (error) {
    console.error("Profile fetch error:", error)
    redirect("/not-found")
  }

  if (!profile) {
    redirect("/not-found")
  }

  // プロフィール所有者かどうかを確認
  const isOwnProfile = session.user.id === profile.id

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <UserProfile 
        profile={profile} 
        isOwnProfile={isOwnProfile}
      />
    </div>
  )
}

export default ProfilePage