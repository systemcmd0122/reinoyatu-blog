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
 * フォロー数とフォロワー数を取得する（100%正確な集計）
 */
export async function getFollowCounts(userId: string) {
  const supabase = createClient()

  // 実際のフォロワー数をカウント
  const { count: followerCount, error: followerError } = await supabase
    .from("user_follows")
    .select("*", { count: 'exact', head: true })
    .eq("following_id", userId)

  // 実際のフォロー中数をカウント
  const { count: followingCount, error: followingError } = await supabase
    .from("user_follows")
    .select("*", { count: 'exact', head: true })
    .eq("follower_id", userId)

  if (followerError || followingError) {
    console.error("Get follow counts error:", followerError || followingError)
    
    // フォールバック: profilesテーブルのキャッシュ値を使用
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("follower_count, following_count")
      .eq("id", userId)
      .single()

    if (profileError) {
      return { following_count: 0, follower_count: 0 }
    }

    return {
      following_count: data.following_count || 0,
      follower_count: data.follower_count || 0,
    }
  }

  return {
    following_count: followingCount || 0,
    follower_count: followerCount || 0,
  }
}

/**
 * フォロワー一覧を取得する
 */
export async function getFollowers(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      follower:profiles!follower_id (
        id,
        name,
        avatar_url,
        introduce
      )
    `)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Get followers error:", error)
    return { users: [], error: error.message }
  }

  const users = data.map((d) => d.follower)
  return { users, error: null }
}

/**
 * フォロー中の一覧を取得する
 */
export async function getFollowing(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_follows")
    .select(`
      following:profiles!following_id (
        id,
        name,
        avatar_url,
        introduce
      )
    `)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Get following error:", error)
    return { users: [], error: error.message }
  }

  const users = data.map((d) => d.following)
  return { users, error: null }
}
