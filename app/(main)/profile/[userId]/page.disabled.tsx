// Disabled copy of the original page to avoid routing conflict with [profileId]
// Kept for reference. This file will not be picked up by Next.js as a route.

import { Suspense } from "react"
import UserProfile from "@/components/user/UserProfile"
import Loading from "@/app/loading"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

interface UserProfilePageProps {
  params: {
    userId: string
  }
}

// ユーザープロフィールページ (disabled)
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
      <Suspense fallback={<Loading />}>
        <UserProfile profile={profile} />
      </Suspense>
    </div>
  )
}

export default UserProfilePage
