"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ProfileType } from "@/types"
// Image import removed because it's unused
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

interface UserProfileProps {
  profile: ProfileType
}

const UserProfile = ({ profile }: UserProfileProps) => {
  const router = useRouter()
  const supabase = createClient()
  const [isCurrentUser, setIsCurrentUser] = useState(false)

  // セッション確認
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsCurrentUser(session?.user.id === profile.id)
    }
    checkSession()
  }, [supabase, profile.id])

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-6 mb-6">
        <Avatar className="w-24 h-24">
          <AvatarImage
            src={profile.avatar_url || "/default.png"}
            alt={profile.name}
          />
          <AvatarFallback>{profile.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {profile.introduce && (
            <p className="text-gray-600 mt-2">{profile.introduce}</p>
          )}
        </div>
      </div>

      {isCurrentUser && (
        <div className="flex justify-end">
          <Button
            onClick={() => router.push("/settings/profile")}
            variant="outline"
          >
            プロフィールを編集
          </Button>
        </div>
      )}

      {/* ここに投稿一覧やその他の情報を表示できます */}
    </div>
  )
}

export default UserProfile