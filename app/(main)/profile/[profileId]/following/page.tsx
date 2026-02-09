import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getFollowing } from "@/actions/follow"
import UserList from "@/components/profile/UserList"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params
  const supabase = createClient()

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", profileId)
    .single()

  if (!profile) return notFound()

  const { users, error } = await getFollowing(profileId)
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href={`/profile/${profileId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {profile.name}さんがフォロー中
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {users.length}人のユーザーをフォローしています
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-[2rem] p-6 md:p-10 shadow-sm min-h-[400px]">
        <UserList
          users={users as any}
          currentUserId={session?.user?.id}
        />
      </div>
    </div>
  )
}
