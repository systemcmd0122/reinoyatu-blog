"use server"

import { createClient } from "@/utils/supabase/server"

interface NewCommentProps {
  blogId: string
  userId: string
  content: string
  parentId?: string
}

// コメント投稿
export const newComment = async ({ blogId, userId, content, parentId }: NewCommentProps) => {
  try {
    const supabase = createClient()

    // コメント新規作成
    const { data, error } = await supabase
      .from("comments")
      .insert({
        blog_id: blogId,
        user_id: userId,
        parent_id: parentId || null,
        content,
      })
      .select()
      .single()

    // エラーチェック
    if (error) {
      return { error: error.message, comment: null }
    }

    // プロフィール情報を取得
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", userId)
      .single()

    if (profileError) {
      return { 
        error: null, 
        comment: { 
          ...data,
          user_name: "不明なユーザー",
          user_avatar_url: null 
        } 
      }
    }

    // コメントとプロフィール情報を結合
    return { 
      error: null, 
      comment: { 
        ...data,
        user_name: profileData.name,
        user_avatar_url: profileData.avatar_url 
      } 
    }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", comment: null }
  }
}

interface EditCommentProps {
  commentId: string
  userId: string
  content: string
}

// コメント編集
export const editComment = async ({ commentId, userId, content }: EditCommentProps) => {
  try {
    const supabase = createClient()

    // コメント編集
    const { error } = await supabase
      .from("comments")
      .update({ content })
      .eq("id", commentId)
      .eq("user_id", userId)

    // エラーチェック
    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

interface DeleteCommentProps {
  commentId: string
  userId: string
}

// コメント削除
export const deleteComment = async ({ commentId, userId }: DeleteCommentProps) => {
  try {
    const supabase = createClient()

    // コメント削除
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)

    // エラーチェック
    if (error) {
      return { error: error.message }
    }

    return { error: null }
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

    return { error: null, comments: data || [] }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", comments: [] }
  }
}