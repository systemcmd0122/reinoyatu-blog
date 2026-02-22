"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { cleanupUnusedImages } from "./image"

/**
 * ユーザーのデータ統計を取得する
 */
export async function getUserDataStats() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userId = user.id
  
  const [blogsRes, collectionsRes, imagesRes, likesRes, bookmarksRes] = await Promise.all([
    supabase.from("blogs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("collections").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("images").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("likes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ])

  return {
    blogsCount: blogsRes.count || 0,
    collectionsCount: collectionsRes.count || 0,
    imagesCount: imagesRes.count || 0,
    likesCount: likesRes.count || 0,
    bookmarksCount: bookmarksRes.count || 0,
  }
}

/**
 * ユーザーのブログ一覧を取得する
 */
export async function getUserBlogs() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data, error } = await supabase
    .from("blogs")
    .select("id, title, created_at, is_published")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) return { error: error.message }
  return { blogs: data }
}

/**
 * ユーザーのコレクション一覧を取得する
 */
export async function getUserCollections() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data, error } = await supabase
    .from("collections")
    .select("id, title, created_at, is_public")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) return { error: error.message }
  return { collections: data }
}

/**
 * ユーザーの画像ライブラリ一覧を取得する
 */
export async function getUserImages() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data, error } = await supabase
    .from("images")
    .select("id, public_url, storage_path, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) return { error: error.message }
  return { images: data }
}

/**
 * 特定の画像を削除する（未使用の場合のみストレージからも削除）
 */
export async function deleteImage(imageId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }
  
  // 権限チェック
  const { data: image } = await supabase
    .from("images")
    .select("user_id, storage_path")
    .eq("id", imageId)
    .single()
  
  if (!image || image.user_id !== user.id) {
    return { error: "権限がありません" }
  }

  // cleanupUnusedImages を利用して削除を試みる
  const res = await cleanupUnusedImages([imageId])
  
  if (res.error) return { error: res.error }
  
  revalidatePath("/settings/data")
  return { success: true }
}

/**
 * すべてのデータを削除する（非常に慎重に行う必要がある）
 */
export async function deleteAllUserData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const userId = user.id
  
  // 1. ブログに関連付けられた画像を抽出（クリーンアップのため）
  const { data: blogImages } = await supabase
    .from("article_images")
    .select("image_id")
    .in("article_id", (await supabase.from("blogs").select("id").eq("user_id", userId)).data?.map(b => b.id) || [])
  
  const imageIds = [...new Set(blogImages?.map(bi => bi.image_id) || [])]

  // 2. ブログを削除（CASCADEにより関連データも削除されるはずだが、ストレージのクリーンアップは手動）
  const { error: blogDeleteError } = await supabase
    .from("blogs")
    .delete()
    .eq("user_id", userId)
  
  if (blogDeleteError) return { error: blogDeleteError.message }

  // 3. コレクションを削除
  await supabase.from("collections").delete().eq("user_id", userId)

  // 4. 画像のクリーンアップ
  if (imageIds.length > 0) {
    await cleanupUnusedImages(imageIds)
  }

  // 5. ユーザー自身がアップロードした画像（ブログに使われていなかったものも含む）を削除
  // cleanupUnusedImages を利用して一括クリーンアップ
  const { data: userImages } = await supabase
    .from("images")
    .select("id")
    .eq("user_id", userId)
  
  if (userImages && userImages.length > 0) {
    await cleanupUnusedImages(userImages.map(img => img.id))
  }

  revalidatePath("/")
  revalidatePath("/profile/" + userId)
  revalidatePath("/settings/data")
  
  return { success: true }
}
