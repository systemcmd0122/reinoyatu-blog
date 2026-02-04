"use server"

import { createClient } from "@/utils/supabase/server"
import { emojiToShortcode, shortcodeToEmoji } from "@/utils/emoji"

interface NewCommentProps {
  blogId: string
  userId: string
  content: string
  parentId?: string
}

// コメント投稿
export const newComment = async ({ blogId, userId, content, parentId }: NewCommentProps) => {
  try {
    // Validate required IDs
    if (!blogId) return { error: "blogId is required", comment: null }
    if (!userId) return { error: "userId is required", comment: null }
    const supabase = createClient()

    // 絵文字をShortcodeに変換してから保存
    const contentWithShortcodes = emojiToShortcode(content)

    // コメント新規作成
    const { data, error } = await supabase
      .from("comments")
      .insert({
        blog_id: blogId,
        user_id: userId,
        parent_id: parentId || null,
        content: contentWithShortcodes,
      })
      .select()
      .single()

    // エラーチェック
    if (error) {
      return { error: error.message, comment: null }
    }

    // プロフィール情報を取得（userIdが有効な場合のみ）
    let profileData: any = null
    let profileError: any = null
    if (userId) {
      const res = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", userId)
        .single()

      profileData = res.data
      profileError = res.error
    } else {
      profileError = { message: "userId is undefined" }
    }

    if (profileError) {
      return { 
        error: null, 
        comment: { 
          ...data,
          content: shortcodeToEmoji(data.content),
          user_name: "不明なユーザー",
          user_avatar_url: null 
        } 
      }
    }

    // コメントとプロフィール情報を結合して返す
    return { 
      success: true,
      error: null, 
      comment: { 
        ...data,
        content: shortcodeToEmoji(data.content),
        user_name: profileData.name,
        user_avatar_url: profileData.avatar_url 
      } 
    }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", comment: null }
  }
}

// コメント編集
export const editComment = async ({ commentId, userId, content }: {
  commentId: string
  userId: string
  content: string
}) => {
  try {
    const supabase = createClient()

    // 絵文字をShortcodeに変換してから保存
    const contentWithShortcodes = emojiToShortcode(content)

    const { error } = await supabase
      .from("comments")
      .update({ content: contentWithShortcodes })
      .eq("id", commentId)
      .eq("user_id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

// コメント削除（変更なし）
export const deleteComment = async ({ commentId, userId }: {
  commentId: string
  userId: string
}) => {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

// ブログのコメント取得
export const getBlogComments = async (blogId: string) => {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('get_blog_comments_with_replies', {
        blog_uuid: blogId
      })

    if (error) {
      return { error: error.message, comments: [] }
    }

    // 取得したコメントのShortcodeを絵文字に変換
    const commentsWithEmoji = data?.map((comment: { content: string }) => ({
      ...comment,
      content: shortcodeToEmoji(comment.content)
    })) || []

    return { error: null, comments: commentsWithEmoji }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", comments: [] }
  }
}