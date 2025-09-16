"use server"

import { createClient } from "@/utils/supabase/server"

interface ToggleBookmarkProps {
  blogId: string
  userId: string
}

// ブックマークの切り替え（追加/削除）
export const toggleBookmark = async ({ blogId, userId }: ToggleBookmarkProps) => {
  try {
    if (!blogId) return { error: "blogId is required", action: null }
    if (!userId) return { error: "userId is required", action: null }
    const supabase = createClient()

    // RLS (Row Level Security) を使用して、一度の操作で切り替えを実行
    const { data, error } = await supabase.rpc('toggle_bookmark', {
      p_blog_id: blogId,
      p_user_id: userId
    })

    if (error) {
      console.error('Toggle bookmark error:', error)
      return { error: error.message, action: null }
    }

    // データベース関数から返された action を使用
    return { error: null, action: data ? 'bookmarked' : 'unbookmarked' }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", action: null }
  }
}

// ブログのブックマーク状態を取得
export const getBlogBookmarkStatus = async ({ blogId, userId }: ToggleBookmarkProps) => {
  try {
    if (!blogId) return { error: "blogId is required", isBookmarked: false }
    if (!userId) return { error: "userId is required", isBookmarked: false }
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
        
        // プロフィール情報を取得（user_id がある場合のみ）
        let profileData = null
        if (blog.user_id) {
          const { data: pd } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", blog.user_id)
            .single()
          profileData = pd
        }

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