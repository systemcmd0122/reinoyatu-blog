"use server"

import { ProfileSchema, EmailSchema } from "@/schemas"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { ProfileType } from "@/types"
import { decode } from "base64-arraybuffer"

type updateProfileProps = z.infer<typeof ProfileSchema> & {
  profile: ProfileType
  base64Image: string | undefined
}

// プロフィール更新
export const updateProfile = async (values: updateProfileProps) => {
  try {
    // バリデーション
    const result = ProfileSchema.safeParse(values)
    if (!result.success) {
      console.error("Profile validation error:", result.error)
      return { success: false, error: result.error.errors[0].message }
    }

    const supabase = createClient()
    let avatar_url = values.profile.avatar_url

    // 画像処理
    if (values.base64Image) {
      // 画像サイズと形式のバリデーション
      const matches = values.base64Image.match(/^data:(.+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return { success: false, error: "無効な画像データです" }
      }

      const contentType = matches[1]
      const base64Data = matches[2]
      
      // 画像形式の確認
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(contentType)) {
        return { success: false, error: "jpeg, png, gif形式のみ対応しています" }
      }

      // サイズチェック（base64データのサイズを計算）
      const sizeInBytes = Math.ceil((base64Data.length / 4) * 3)
      if (sizeInBytes > 5 * 1024 * 1024) { // 5MB制限
        return { success: false, error: "画像サイズは5MB以下にしてください" }
      }

      // 拡張子を取得
      const fileExt = contentType.split("/")[1] // 例: "png"

      // ファイル名を生成
      const fileName = `${uuidv4()}.${fileExt}`

      const { error: storageError } = await supabase.storage
        .from("profile")
        .upload(`${values.profile.id}/${fileName}`, decode(base64Data), {
          contentType,
        })

      if (storageError) {
        console.error("Storage upload error:", storageError)
        return { success: false, error: storageError.message }
      }

      // 古い画像を削除
      if (avatar_url) {
        const fileName = avatar_url.split("/").slice(-1)[0]
        await supabase.storage
          .from("profile")
          .remove([`${values.profile.id}/${fileName}`])
      }

      // 画像のURLを取得
      const { data: urlData } = await supabase.storage
        .from("profile")
        .getPublicUrl(`${values.profile.id}/${fileName}`)

      avatar_url = urlData.publicUrl
    }

    // ソーシャルリンクの処理（空文字列を除去）
    const processedSocialLinks = values.social_links ? 
      Object.entries(values.social_links).reduce((acc, [key, value]) => {
        if (value && value.trim() !== "") {
          acc[key] = value.trim()
        }
        return acc
      }, {} as Record<string, string>) : {}

    // プロフィールアップデート
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: values.name.trim(),
        introduce: values.introduce?.trim() || null,
        avatar_url,
        email: values.email?.trim() || null,
        website: values.website?.trim() || null,
        social_links: processedSocialLinks,
        updated_at: new Date().toISOString()
      })
      .eq("id", values.profile.id)

    // エラーチェック
    if (updateError) {
      console.error("Profile update error:", updateError)
      return { success: false, error: updateError.message }
    }

    console.log("Profile updated successfully")
    return { success: true, error: null }
  } catch (err) {
    console.error("Unexpected error:", err)
    return { success: false, error: "エラーが発生しました" }
  }
}

// アカウント削除
export const deleteAccount = async () => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    // プロフィールを削除（CASCADE制約により関連データも削除される想定）
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile deletion error:", profileError)
      return { success: false, error: profileError.message }
    }

    // ログアウト
    await supabase.auth.signOut()

    return { success: true, error: null }
  } catch (err) {
    console.error("Account deletion error:", err)
    return { success: false, error: "アカウントの削除中にエラーが発生しました" }
  }
}

// メールアドレス変更
export const updateEmail = async (values: z.infer<typeof EmailSchema>) => {
  try {
    // バリデーション
    const result = EmailSchema.safeParse(values)
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    const supabase = createClient()

    // メールアドレス変更メールを送信
    const { error: updateUserError } = await supabase.auth.updateUser(
      { email: values.email },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/email/verify` }
    )

    if (updateUserError) {
      console.error("Update email error:", updateUserError)
      return { success: false, error: updateUserError.message }
    }

    // ログアウト
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error("Sign out error:", signOutError)
      return { success: false, error: signOutError.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error("Unexpected error:", err)
    return { success: false, error: "エラーが発生しました" }
  }
}
