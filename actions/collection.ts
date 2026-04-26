"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { CollectionSchema } from "@/schemas"
import { createNotification } from "./notification"
import { z } from "zod"
import { CollectionType, CollectionItemType } from "@/types"

/**
 * コレクションを作成する
 */
export async function createCollection(userId: string, values: z.infer<typeof CollectionSchema>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      title: values.title,
      description: values.description,
      is_public: values.is_public,
    })
    .select()
    .single()

  if (error) {
    console.error("Create collection error:", error)
    return { success: false, error: "コレクションの作成に失敗しました" }
  }

  revalidatePath(`/profile/${userId}`)
  return { success: true, data }
}

/**
 * コレクションを更新する
 */
export async function updateCollection(collectionId: string, values: z.infer<typeof CollectionSchema>) {
  const supabase = createClient()

  const { error } = await supabase
    .from("collections")
    .update({
      title: values.title,
      description: values.description,
      is_public: values.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq("id", collectionId)

  if (error) {
    console.error("Update collection error:", error)
    return { success: false, error: "コレクションの更新に失敗しました" }
  }

  revalidatePath(`/collections/${collectionId}`)
  return { success: true }
}

/**
 * コレクションを削除する
 */
export async function deleteCollection(collectionId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)

  if (error) {
    console.error("Delete collection error:", error)
    return { success: false, error: "コレクションの削除に失敗しました" }
  }

  revalidatePath(`/profile/${userId}`)
  return { success: true }
}

/**
 * コレクションにブログを追加する
 */
export async function addBlogToCollection(collectionId: string, blogId: string) {
  const supabase = createClient()

  // 現在の最大オーダーを取得
  const { data: items } = await supabase
    .from("collection_items")
    .select("order_index")
    .eq("collection_id", collectionId)
    .order("order_index", { ascending: false })
    .limit(1)

  const nextOrder = items && items.length > 0 ? items[0].order_index + 1 : 0

  const { error } = await supabase
    .from("collection_items")
    .insert({
      collection_id: collectionId,
      blog_id: blogId,
      order_index: nextOrder,
    })

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "この記事は既にコレクションに含まれています" }
    }
    console.error("Add blog to collection error:", error)
    return { success: false, error: "コレクションへの追加に失敗しました" }
  }

  // 記事の投稿者に通知
  const { data: blogData } = await supabase
    .from("blogs")
    .select("user_id")
    .eq("id", blogId)
    .single()

  if (blogData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await createNotification({
        userId: blogData.user_id,
        actorId: user.id,
        type: 'collection_add',
        targetId: collectionId,
        targetType: 'collection'
      })
    }
  }

  revalidatePath(`/blog/${blogId}`)
  revalidatePath(`/collections/${collectionId}`)
  return { success: true }
}

/**
 * コレクションからブログを削除する
 */
export async function removeBlogFromCollection(collectionId: string, blogId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("blog_id", blogId)

  if (error) {
    console.error("Remove blog from collection error:", error)
    return { success: false, error: "コレクションからの削除に失敗しました" }
  }

  revalidatePath(`/blog/${blogId}`)
  revalidatePath(`/collections/${collectionId}`)
  return { success: true }
}

/**
 * コレクション内アイテムの順序を更新する
 *
 * upsert は blog_id NOT NULL 制約で失敗するため、
 * collection_items の行 id を使って個別に update する。
 */
export async function updateCollectionItemsOrder(collectionId: string, itemIds: string[]) {
  const supabase = createClient()

  // Promise.all で並列更新
  const results = await Promise.all(
    itemIds.map((id, index) =>
      supabase
        .from("collection_items")
        .update({ order_index: index })
        .eq("id", id)
        .eq("collection_id", collectionId) // 安全のため collection_id も条件に加える
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) {
    console.error("Update collection items order error:", failed.error)
    return { success: false, error: "順序の更新に失敗しました" }
  }

  revalidatePath(`/collections/${collectionId}`)
  return { success: true }
}

/**
 * コレクション一覧を取得する
 */
export async function getCollections(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("collections")
    .select(`
      *,
      collection_items (count)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get collections error:", error)
    return []
  }

  return data.map(c => ({
    ...c,
    item_count: c.collection_items[0]?.count || 0
  })) as CollectionType[]
}

/**
 * 特定のコレクションとその詳細を取得する
 */
export async function getCollectionWithItems(collectionId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("collections")
    .select(`
      *,
      profiles!user_id (id, name, avatar_url),
      collection_items (
        id,
        order_index,
        blog_id,
        blogs (
          id,
          title,
          summary,
          image_url,
          created_at,
          updated_at,
          user_id,
          is_published,
          profiles!user_id (id, name, avatar_url)
        )
      )
    `)
    .eq("id", collectionId)
    .single()

  if (error) {
    console.error("Get collection with items error:", error)
    return null
  }

  if (data.collection_items) {
    data.collection_items.sort((a: any, b: any) => a.order_index - b.order_index)
  }

  return data
}

/**
 * ブログが属しているコレクション（プレイリスト）を取得する
 */
export async function getBlogCollections(blogId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("collection_items")
    .select(`
      collection_id,
      collections (
        id,
        title,
        user_id
      )
    `)
    .eq("blog_id", blogId)

  if (error) {
    console.error("Get blog collections error:", error)
    return []
  }

  return (data?.map(item => item.collections).filter(Boolean) || []) as unknown as { id: string, title: string, user_id: string }[]
}