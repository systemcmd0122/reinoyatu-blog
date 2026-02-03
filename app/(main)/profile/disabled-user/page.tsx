import UserProfile from "@/components/profile/UserProfile"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

interface UserProfilePageProps {
  params: Promise<{
    userId: string
  }>
}

// ユーザープロフィールページ（移動済み、非ルート）
const UserProfilePage = async ({ params }: UserProfilePageProps) => {
  const { userId } = await params
  const supabase = createClient()

  // セッション情報を取得
  const { data: { session } } = await supabase.auth.getSession()

  // ユーザープロフィールを取得
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      introduce,
      avatar_url,
      email,
      website,
      social_links,
      created_at,
      updated_at
    `)
    .eq("id", userId)
    .single()

  if (error || !profile) {
    console.error(`Profile fetch error for user ID ${userId}:`, error)
    notFound()
  }

  // プロフィール所有者かどうかを確認
  const isOwnProfile = !!session && session.user && session.user.id === profile.id

  return (
    <main className="min-h-screen">
      <UserProfile 
        profile={profile} 
        isOwnProfile={isOwnProfile}
      />
    </main>
  )
}

export default UserProfilePage