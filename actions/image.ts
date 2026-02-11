"use server"

import { createClient } from "@/utils/supabase/server"
import { decode } from "base64-arraybuffer"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

/**
 * 画像のハッシュ値を計算する
 */
const calculateHash = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

interface UploadImageProps {
  base64Image?: string
  file?: File // Note: File can't be passed directly to Server Action from client easily in some cases, but we'll handle base64
  userId: string
}

/**
 * 画像をアップロードし、メタデータをDBに保存する。
 * 同一ハッシュの画像が存在する場合は再利用する。
 */
export const uploadImage = async (base64Image: string, userId: string) => {
  try {
    const supabase = createClient()
    
    // base64データのパース
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return { error: "無効な画像データです" }
    }
    const contentType = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, "base64")
    
    // ハッシュ計算
    const hash = calculateHash(buffer)
    
    // 既存のハッシュをチェック
    const { data: existingImage, error: searchError } = await supabase
      .from("images")
      .select("*")
      .eq("hash", hash)
      .maybeSingle()
    
    if (searchError) {
      console.error("画像検索エラー:", searchError)
    }
    
    if (existingImage) {
      return { success: true, data: existingImage }
    }
    
    // 新規アップロード
    const fileExt = contentType.split("/")[1] || "png"
    const fileName = `${uuidv4()}.${fileExt}`
    const storagePath = `${userId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from("blogs")
      .upload(storagePath, decode(base64Data), {
        contentType,
        upsert: true
      })
    
    if (uploadError) {
      console.error("ストレージアップロードエラー:", uploadError)
      return { error: uploadError.message }
    }
    
    const { data: urlData } = supabase.storage
      .from("blogs")
      .getPublicUrl(storagePath)
    
    const publicUrl = urlData.publicUrl
    
    // DBに保存
    const { data: newImage, error: insertError } = await supabase
      .from("images")
      .insert({
        user_id: userId,
        storage_path: storagePath,
        public_url: publicUrl,
        hash: hash
      })
      .select("*")
      .single()
    
    if (insertError) {
      console.error("画像メタデータ保存エラー:", insertError)
      return { error: insertError.message }
    }
    
    return { success: true, data: newImage }
  } catch (err) {
    console.error("画像アップロードエラー:", err)
    return { error: "エラーが発生しました" }
  }
}

/**
 * ユーザーがアップロードした過去の画像一覧を取得
 */
export const getUserImages = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("画像取得エラー:", error)
      return { error: error.message }
    }
    
    return { success: true, images: data }
  } catch (err) {
    console.error("画像取得エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

/**
 * 記事の内容（JSON）とサムネイルURLから画像を抽出し、article_imagesを同期する
 */
export const syncArticleImages = async (articleId: string, contentJson: string, thumbnailUrl: string | null) => {
  try {
    const supabase = createClient()
    const urls = new Set<string>()
    
    if (thumbnailUrl) {
      urls.add(thumbnailUrl)
    }
    
    if (contentJson) {
      try {
        const json = JSON.parse(contentJson)
        // 再帰的にimageノードを探す
        const extractImages = (node: any) => {
          if (node.type === "image" && node.attrs?.src) {
            urls.add(node.attrs.src)
          }
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractImages)
          }
        }
        extractImages(json)
      } catch (e) {
        console.error("JSONパースエラー:", e)
      }
    }
    
    if (urls.size === 0) {
      // 関連を削除
      await supabase.from("article_images").delete().eq("article_id", articleId)
      return { success: true }
    }
    
    // URLに対応するimage_idを取得
    const { data: images, error: fetchError } = await supabase
      .from("images")
      .select("id, public_url")
      .in("public_url", Array.from(urls))
    
    if (fetchError) {
      console.error("画像ID取得エラー:", fetchError)
      return { error: fetchError.message }
    }
    
    const imageIds = images.map(img => img.id)
    
    // 現在の関連を取得
    const { data: existingRelations } = await supabase
      .from("article_images")
      .select("image_id")
      .eq("article_id", articleId)
    
    const existingIds = existingRelations?.map(r => r.image_id) || []
    
    // 不要な関連を削除
    const toDelete = existingIds.filter(id => !imageIds.includes(id))
    if (toDelete.length > 0) {
      await supabase
        .from("article_images")
        .delete()
        .eq("article_id", articleId)
        .in("image_id", toDelete)
      
      // 削除された画像が他の記事でも使われていないかチェックし、未使用ならクリーンアップ
      await cleanupUnusedImages(toDelete)
    }
    
    // 新規関連を追加
    const toInsert = imageIds.filter(id => !existingIds.includes(id))
    if (toInsert.length > 0) {
      const inserts = toInsert.map(id => ({
        article_id: articleId,
        image_id: id
      }))
      await supabase.from("article_images").insert(inserts)
    }
    
    return { success: true }
  } catch (err) {
    console.error("画像同期エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

/**
 * どの記事でも使われなくなった画像をクリーンアップする
 */
export const cleanupUnusedImages = async (imageIds: string[]) => {
  try {
    const supabase = createClient()
    
    for (const imageId of imageIds) {
      // 他に使用している記事があるかチェック
      const { count, error: countError } = await supabase
        .from("article_images")
        .select("*", { count: "exact", head: true })
        .eq("image_id", imageId)
      
      if (countError) continue
      
      if (count === 0) {
        // 画像情報を取得
        const { data: image } = await supabase
          .from("images")
          .select("storage_path")
          .eq("id", imageId)
          .single()
        
        if (image) {
          // ストレージから削除
          await supabase.storage
            .from("blogs")
            .remove([image.storage_path])
          
          // DBから削除
          await supabase.from("images").delete().eq("id", imageId)
        }
      }
    }
    
    return { success: true }
  } catch (err) {
    console.error("クリーンアップエラー:", err)
    return { error: "エラーが発生しました" }
  }
}
