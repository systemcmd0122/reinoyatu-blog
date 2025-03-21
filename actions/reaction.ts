"use server"

import { createClient } from "@/utils/supabase/server"
import { ReactionType } from "@/types"

interface ToggleReactionProps {
  commentId: string
  userId: string
  emoji: string
}

export const toggleReaction = async ({
  commentId,
  userId,
  emoji,
}: ToggleReactionProps) => {
  try {
    const supabase = createClient()

    // 既存のリアクションを確認
    const { data: existingReaction } = await supabase
      .from("comment_reactions")
      .select()
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .single()

    if (existingReaction) {
      // リアクションが存在する場合は削除
      const { error: deleteError } = await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .eq("emoji", emoji)

      if (deleteError) {
        return { error: deleteError.message }
      }
    } else {
      // リアクションが存在しない場合は追加
      const { error: insertError } = await supabase
        .from("comment_reactions")
        .insert({
          comment_id: commentId,
          user_id: userId,
          emoji,
        })

      if (insertError) {
        return { error: insertError.message }
      }
    }

    // 更新後のリアクション情報を取得
    const { data: reactions, error: reactionsError } = await supabase
      .rpc("get_comment_reactions", {
        comment_uuid: commentId
      })

    if (reactionsError) {
      return { error: reactionsError.message }
    }

    return { reactions }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

// コメントのリアクションを取得
export const getCommentReactions = async (commentId: string): Promise<{
  error: string | null
  reactions: ReactionType[] | null
}> => {
  try {
    const supabase = createClient()

    const { data: reactions, error } = await supabase
      .rpc("get_comment_reactions", {
        comment_uuid: commentId
      })

    if (error) {
      return { error: error.message, reactions: null }
    }

    return { error: null, reactions }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました", reactions: null }
  }
}