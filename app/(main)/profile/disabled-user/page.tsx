import UserProfile from "@/components/user/UserProfile"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

interface UserProfilePageProps {
  params: {
    userId: string
  }
}

// ユーザープロフィールページ（移動済み、非ルート）
const UserProfilePage = async ({ params }: UserProfilePageProps) => {
  const supabase = createClient()

  // ユーザープロフィールを取得
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single()

  if (error || !profile) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <UserProfile profile={profile} />
    </div>
  )
}

export default UserProfilePage
