import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import UserProfile from "@/components/profile/UserProfile"
import { Metadata } from "next"

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

export async function generateMetadata({ params }: { params: { profileId: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select(`id, name, introduce, avatar_url, created_at`)
    .eq("id", params.profileId)
    .single()

  if (!profile) {
    return {
      title: "ユーザーが見つかりません｜例のヤツ",
      description: "指定されたユーザーのプロフィールは見つかりませんでした。",
    }
  }

  const title = `${profile.name || "ユーザー"}｜例のヤツ`
  const description = (profile.introduce || "").replace(/\n+/g, " ").slice(0, 160) || "例のヤツのプロフィールページです。"
  const image = profile.avatar_url || `${process.env.NEXT_PUBLIC_APP_URL || ""}/default.png`
  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/profile/${profile.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, alt: title }],
      type: "profile",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [image],
    },
  }
}