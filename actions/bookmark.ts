"use server"

import { createClient } from "@/utils/supabase/server"

interface ToggleBookmarkProps {
  blogId: string
  userId: string
}

// ブックマークの切り替え（追加/削除）
export const toggleBookmark = async ({ blogId, userId }: ToggleBookmarkProps) => {
  try {
    const supabase = createClient()

    // まず、すでにブックマークしているか確認
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", userId)
      .single()

    if (existingBookmark) {
      // ブックマークが存在する場合は削除
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", existingBookmark.id)

      if (deleteError) {
        return { error: deleteError.message, action: null }
      }

      return { error: null, action: "unbookmarked" }
    } else {
      // ブックマークが存在しない場合は追加
      const { error: insertError } = await supabase
        .from("bookmarks")
        .insert({
          blog_id: blogId,
          user_id: userId,
        })

      if (insertError) {
        return { error: insertError.message, action: null }
      }

      return { error: null, action: "bookmarked" }
    }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", action: null }
  }
}

// ブログのブックマーク状態を取得
export const getBlogBookmarkStatus = async ({ blogId, userId }: ToggleBookmarkProps) => {
  try {
    const supabase = createClient()

    // ブックマークの存在確認
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116は「結果が見つからない」エラー
      return { error: error.message, isBookmarked: false }
    }

    return { error: null, isBookmarked: !!data }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", isBookmarked: false }
  }
}

// ユーザーのブックマーク済みブログ記事を取得
export const getUserBookmarks = async (userId: string) => {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.rpc('get_user_bookmarks', {
      user_uuid: userId
    })

    if (error) {
      return { error: error.message, blogs: [] }
    }

    // 各ブログのいいね数とプロフィール情報を取得
    const blogsWithDetails = await Promise.all(
      (data || []).map(async (blog: { id: any; user_id: any }) => {
        // いいね数を取得
        const { data: likesCount } = await supabase.rpc(
          'get_blog_likes_count',
          { blog_id: blog.id }
        )
        
        // プロフィール情報を取得
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", blog.user_id)
          .single()
          
        return {
          ...blog,
          likes_count: likesCount || 0,
          profiles: profileData
        }
      })
    )

    return { error: null, blogs: blogsWithDetails }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", blogs: [] }
  }
}