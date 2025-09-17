import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import UserProfile from "@/components/profile/UserProfile"
import { Metadata } from "next"

// 安全なUUID検証関数
const isValidUUID = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false
  
  // 基本的な長さとハイフンの位置をチェック
  if (id.length !== 36) return false
  if (id[8] !== '-' || id[13] !== '-' || id[18] !== '-' || id[23] !== '-') return false
  
  // 各セクションを個別に検証
  const sections = id.split('-')
  if (sections.length !== 5) return false
  
  const expectedLengths = [8, 4, 4, 4, 12]
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    
    // 長さチェック
    if (section.length !== expectedLengths[i]) return false
    
    // 16進数文字のみかチェック
    for (let j = 0; j < section.length; j++) {
      const char = section[j].toLowerCase()
      if (!(char >= '0' && char <= '9') && !(char >= 'a' && char <= 'f')) {
        return false
      }
    }
  }
  
  return true
}

const ProfilePage = async ({
  params,
}: {
  params: { profileId: string }
}) => {
  const supabase = createClient()

  // パラメータのバリデーション
  const id = params?.profileId
  if (!id || id === "undefined") {
    console.error("Invalid profile ID: undefined or empty")
    return notFound()
  }

  // UUIDの形式チェック（安全版）
  if (!isValidUUID(id)) {
    console.error(`Invalid UUID format: ${id}`)
    return notFound()
  }

  // セッション情報を取得（任意）。未認証でもプロフィールは閲覧できるようにする。
  const { data: { session } } = await supabase.auth.getSession()

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
      social_links,
      created_at,
      blogs (
        id,
        title,
        created_at
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Profile fetch error for ID ${id}:`, error)
    return notFound()
  }

  if (!profile) {
    console.error(`Profile not found for ID ${id}`)
    return notFound()
  }

  // プロフィール所有者かどうかを確認
  const isOwnProfile = !!session && session.user && session.user.id === profile.id

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
  // パラメータのバリデーション
  const id = params?.profileId
  if (!id || id === "undefined") {
    return {
      title: "無効なプロフィールID｜例のヤツ",
      description: "プロフィールIDが指定されていないか、無効です。",
    }
  }

  // UUIDの形式チェック（安全版）
  if (!isValidUUID(id)) {
    return {
      title: "無効なプロフィールID｜例のヤツ",
      description: "指定されたプロフィールIDの形式が正しくありません。",
    }
  }

  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select(`id, name, introduce, avatar_url`)
    .eq("id", id)
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