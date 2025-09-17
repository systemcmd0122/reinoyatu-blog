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
    const result = ProfileSchema.safeParse(values);
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const supabase = createClient()
    let avatar_url = values.profile.avatar_url

    if (values.base64Image) {
      // 画像サイズと形式のバリデーション
      const matches = values.base64Image.match(/^data:(.+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return { error: "無効な画像データです" }
      }

      const contentType = matches[1]
      const base64Data = matches[2]
      
      // 画像形式の確認
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(contentType)) {
        return { error: "jpeg, png, gif形式のみ対応しています" }
      }

      // サイズチェック（base64データのサイズを計算）
      const sizeInBytes = Math.ceil((base64Data.length / 4) * 3)
      if (sizeInBytes > 5 * 1024 * 1024) { // 5MB制限
        return { error: "画像サイズは5MB以下にしてください" }
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
        return { error: storageError.message }
      }

      if (avatar_url) {
        const fileName = avatar_url.split("/").slice(-1)[0]

        // 古い画像を削除
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

    // プロフィールアップデート
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: values.name,
        introduce: values.introduce,
        avatar_url,
        email: values.email || null,
        website: values.website || null,
        social_links: values.social_links || {},
        updated_at: new Date().toISOString()
      })
      .eq("id", values.profile.id)

    // エラーチェック
    if (updateError) {
      console.error("Profile update error:", updateError)
      return { error: updateError.message }
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

// メールアドレス変更
export const updateEmail = async (values: z.infer<typeof EmailSchema>) => {
  try {
    const supabase = createClient()

    // メールアドレス変更メールを送信
    const { error: updateUserError } = await supabase.auth.updateUser(
      { email: values.email },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/email/verify` }
    )

    if (updateUserError) {
      return { error: updateUserError.message }
    }

    // ログアウト
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      return { error: signOutError.message }
    }
  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}
