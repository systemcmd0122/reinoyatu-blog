"use server"

import { ProfileSchema, EmailSchema, ActionResponse } from "@/schemas"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { ProfileType } from "@/types"
import { parseBase64Image, optimizeImage, validateUser } from "@/utils/image-helpers"

type updateProfileProps = z.infer<typeof ProfileSchema> & {
  profile: ProfileType
  base64Image: string | undefined
}

// プロフィール更新
export const updateProfile = async (values: updateProfileProps): Promise<ActionResponse> => {
  try {
    const user = await validateUser()
    const supabase = createClient()

    // 権限チェック
    if (user.id !== values.profile.id) {
      return { success: false, error: "更新権限がありません" }
    }

    // バリデーション
    const result = ProfileSchema.safeParse(values)
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    let avatar_url = values.profile.avatar_url

    // 画像処理
    if (values.base64Image) {
      const { buffer: originalBuffer } = parseBase64Image(values.base64Image)

      // 画像の最適化
      const { buffer, contentType, extension } = await optimizeImage(originalBuffer, 400) // プロフィール画像は小さく

      const fileName = `${uuidv4()}.${extension}`

      const { error: storageError } = await supabase.storage
        .from("profile")
        .upload(`${user.id}/${fileName}`, buffer, {
          contentType,
        })

      if (storageError) {
        return { success: false, error: "画像のアップロードに失敗しました" }
      }

      // 古い画像を削除
      if (avatar_url) {
        const oldFileName = avatar_url.split("/").slice(-1)[0]
        await supabase.storage
          .from("profile")
          .remove([`${user.id}/${oldFileName}`])
      }

      // 画像のURLを取得
      const { data: urlData } = await supabase.storage
        .from("profile")
        .getPublicUrl(`${user.id}/${fileName}`)

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
        header_image_url: values.header_image_url?.trim() || null,
        email: values.email?.trim() || null,
        homepage_url: values.homepage_url?.trim() || null,
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

// ユーザー検索（メンション・共同投稿者用）
export const searchUsers = async (query: string) => {
  if (!query || query.length < 2) return []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("User search error:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("User search error:", err)
    return []
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
export const updateEmail = async (values: z.infer<typeof EmailSchema>): Promise<ActionResponse> => {
  try {
    await validateUser()
    const supabase = createClient()

    // バリデーション
    const result = EmailSchema.safeParse(values)
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

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

// 外部アカウント連携解除
export const unlinkProvider = async (provider: string) => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    // ユーザーの全ての ID を取得
    const { data, error: identitiesError } = await supabase.auth.getUserIdentities()
    const identities = data?.identities

    console.log("[DEBUG] identities:", identities)
    console.log("[DEBUG] identitiesError:", identitiesError)

    if (identitiesError || !identities) {
      console.error("Get identities error:", identitiesError)
      return { success: false, error: "連携情報の取得に失敗しました" }
    }

    // 指定されたプロバイダーの ID を検索
    const providerIdentity = identities.find(identity => identity.provider === provider)

    console.log("[DEBUG] providerIdentity:", providerIdentity)

    if (!providerIdentity) {
      return { success: false, error: `${provider}との連携が見つかりません` }
    }

    // 複数のプロバイダーがある場合のみ連携解除を許可
    const activeIdentities = identities.filter(id => id.identity_id)
    console.log("[DEBUG] activeIdentities count:", activeIdentities.length)

    if (activeIdentities.length <= 1) {
      return { success: false, error: "唯一の認証方法は削除できません。別の認証方法を事前に設定してください" }
    }

    // サーバーサイドで unlinkIdentity を呼び出し
    console.log("[DEBUG] Calling unlinkIdentity for provider:", provider)
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(providerIdentity)

    console.log("[DEBUG] unlinkError:", unlinkError)

    if (unlinkError) {
      console.error("Unlink error details:", {
        message: unlinkError.message,
        code: (unlinkError as any).code,
        status: (unlinkError as any).status,
      })

      // Manual linking disabled エラーの場合は、ユーザーフレンドリーなメッセージを返す
      if ((unlinkError as any).code === 'manual_linking_disabled') {
        return {
          success: false,
          error: "申し訳ありません。現在、外部アカウントの連携解除機能は利用できません。管理者にお問い合わせください。"
        }
      }

      return { success: false, error: unlinkError.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error("Unexpected error:", err)
    return { success: false, error: "エラーが発生しました" }
  }
}
