"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * ユーザーをフォローする
 */
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    return { success: false, error: "自分自身をフォローすることはできません" }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("user_follows")
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })

  if (error) {
    console.error("Follow error:", error)
    return { success: false, error: "フォローに失敗しました" }
  }

  revalidatePath(`/profile/${followingId}`)
  return { success: true }
}

/**
 * ユーザーのフォローを解除する
 */
export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId)

  if (error) {
    console.error("Unfollow error:", error)
    return { success: false, error: "フォロー解除に失敗しました" }
  }

  revalidatePath(`/profile/${followingId}`)
  return { success: true }
}

/**
 * フォロー状態を取得する
 */
export async function getFollowStatus(followerId: string | undefined, followingId: string) {
  if (!followerId) return { isFollowing: false }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single()

  if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
    console.error("Get follow status error:", error)
    return { isFollowing: false, error: error.message }
  }

  return { isFollowing: !!data }
}

/**
 * フォロー数とフォロワー数を取得する
 */
export async function getFollowCounts(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("follower_count, following_count")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Get follow counts error:", error)
    return { 
      following_count: 0,
      follower_count: 0
    }
  }

  return {
    following_count: data.following_count || 0,
    follower_count: data.follower_count || 0,
  }
}
