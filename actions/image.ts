"use server"

import { createClient } from "@/utils/supabase/server"
import { parseBase64Image, optimizeImage, validateUser, calculateHash } from "@/utils/image-helpers"
import { v4 as uuidv4 } from "uuid"
import { ActionResponse } from "@/schemas"

/**
 * 画像をアップロードし、メタデータをDBに保存する。
 * 同一ハッシュの画像が存在する場合は再利用する。
 */
export const uploadImage = async (base64Image: string): Promise<ActionResponse> => {
  try {
    const user = await validateUser()
    const supabase = createClient()
    
    // base64データのパース
    const { buffer: originalBuffer } = parseBase64Image(base64Image)

    // 画像の最適化 (WebP)
    const { buffer, contentType, extension } = await optimizeImage(originalBuffer)
    
    // ハッシュ計算 (最適化後の画像で計算)
    const hash = calculateHash(buffer)
    
    // 既存のハッシュをチェック
    const { data: existingImage } = await supabase
      .from("images")
      .select("*")
      .eq("hash", hash)
      .maybeSingle()
    
    if (existingImage) {
      return { success: true, data: existingImage }
    }
    
    // 新規アップロード
    const fileName = `${uuidv4()}.${extension}`
    const storagePath = `${user.id}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from("blogs")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      })
    
    if (uploadError) {
      return { success: false, error: "ストレージへのアップロードに失敗しました" }
    }
    
    const { data: urlData } = supabase.storage
      .from("blogs")
      .getPublicUrl(storagePath)
    
    const publicUrl = urlData.publicUrl
    
    // DBに保存
    const { data: newImage, error: insertError } = await supabase
      .from("images")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        public_url: publicUrl,
        hash: hash
      })
      .select("*")
      .single()
    
    if (insertError) {
      return { success: false, error: "メタデータの保存に失敗しました" }
    }
    
    return { success: true, data: newImage }
  } catch (err: any) {
    console.error("画像アップロードエラー:", err)
    return { success: false, error: err.message || "エラーが発生しました" }
  }
}

/**
 * ユーザーがアップロードした過去の画像一覧を取得
 */
export const getUserImages = async (): Promise<ActionResponse> => {
  try {
    const user = await validateUser()
    const supabase = createClient()
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
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
      await supabase.from("article_images").delete().eq("article_id", articleId)
      return { success: true }
    }
    
    const { data: images, error: fetchError } = await supabase
      .from("images")
      .select("id, public_url")
      .in("public_url", Array.from(urls))
    
    if (fetchError) {
      return { success: false, error: fetchError.message }
    }
    
    const imageIds = images.map(img => img.id)
    
    const { data: existingRelations } = await supabase
      .from("article_images")
      .select("image_id")
      .eq("article_id", articleId)
    
    const existingIds = existingRelations?.map(r => r.image_id) || []
    
    const toDelete = existingIds.filter(id => !imageIds.includes(id))
    if (toDelete.length > 0) {
      await supabase
        .from("article_images")
        .delete()
        .eq("article_id", articleId)
        .in("image_id", toDelete)
      
      await cleanupUnusedImages(toDelete)
    }
    
    const toInsert = imageIds.filter(id => !existingIds.includes(id))
    if (toInsert.length > 0) {
      const inserts = toInsert.map(id => ({
        article_id: articleId,
        image_id: id
      }))
      await supabase.from("article_images").insert(inserts)
    }
    
    return { success: true }
  } catch (err: any) {
    console.error("画像同期エラー:", err)
    return { success: false, error: err.message }
  }
}

/**
 * どの記事でも使われなくなった画像をクリーンアップする
 */
export const cleanupUnusedImages = async (imageIds: string[]) => {
  try {
    if (!imageIds.length) return { success: true }
    const supabase = createClient()
    
    const { data: usedRelations } = await supabase
      .from("article_images")
      .select("image_id")
      .in("image_id", imageIds)
    
    const usedImageIds = new Set(usedRelations?.map(r => r.image_id) || [])
    const unusedImageIds = imageIds.filter(id => !usedImageIds.has(id))
    
    if (unusedImageIds.length === 0) return { success: true }

    const { data: imagesToDelete } = await supabase
      .from("images")
      .select("id, storage_path")
      .in("id", unusedImageIds)
    
    if (imagesToDelete && imagesToDelete.length > 0) {
      const storagePaths = imagesToDelete.map(img => img.storage_path)
      
      await supabase.storage
        .from("blogs")
        .remove(storagePaths)
      
      await supabase
        .from("images")
        .delete()
        .in("id", imagesToDelete.map(img => img.id))
    }
    
    return { success: true }
  } catch (err: any) {
    console.error("クリーンアップエラー:", err)
    return { success: false, error: err.message }
  }
}
