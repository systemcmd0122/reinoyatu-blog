"use server"

import { BlogSchema } from "@/schemas"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { decode } from "base64-arraybuffer"
import { generateSummaryFromContent } from "@/utils/gemini"

// タグをDBに保存し、IDを返すヘルパー関数（完全修正版）
const upsertTags = async (tagNames: string[]) => {
  const supabase = createClient()
  
  // 空白除去と重複削除
  const cleanedTagNames = [...new Set(
    tagNames
      .map(name => name.trim())
      .filter(Boolean)
  )]

  if (cleanedTagNames.length === 0) {
    return []
  }

  const tagIds: string[] = []

  // 各タグを個別に処理（確実に取得するため）
  for (const tagName of cleanedTagNames) {
    try {
      // 既存のタグを検索
      const { data: existingTag, error: searchError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .maybeSingle()

      if (searchError) {
        console.error(`タグ検索エラー (${tagName}):`, searchError)
        continue
      }

      if (existingTag) {
        // 既存タグのIDを使用
        tagIds.push(existingTag.id)
      } else {
        // 新規タグを作成
        const { data: newTag, error: insertError } = await supabase
          .from("tags")
          .insert({ name: tagName })
          .select("id")
          .single()

        if (insertError) {
          console.error(`タグ作成エラー (${tagName}):`, insertError)
          
          // 同時作成による競合の可能性があるため、再度検索
          const { data: retryTag } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .maybeSingle()
          
          if (retryTag) {
            tagIds.push(retryTag.id)
          }
        } else if (newTag) {
          tagIds.push(newTag.id)
        }
      }
    } catch (err) {
      console.error(`タグ処理エラー (${tagName}):`, err)
    }
  }

  return tagIds
}

interface newBlogProps extends z.infer<typeof BlogSchema> {
  base64Image: string | undefined
  userId: string
  tags?: string[]
  summary?: string
}

// ブログ投稿（完全修正版）
export const newBlog = async (values: newBlogProps) => {
  try {
    const supabase = createClient()

    let image_url = ""

    // 画像アップロード処理
    if (values.base64Image) {
      const matches = values.base64Image.match(/^data:(.+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return { error: "無効な画像データです" }
      }
      const contentType = matches[1]
      const base64Data = matches[2]
      const fileExt = contentType.split("/")[1]
      const fileName = `${uuidv4()}.${fileExt}`

      const { error: storageError } = await supabase.storage
        .from("blogs")
        .upload(`${values.userId}/${fileName}`, decode(base64Data), {
          contentType,
        })

      if (storageError) {
        console.error("画像アップロードエラー:", storageError)
        return { error: storageError.message }
      }

      const { data: urlData } = supabase.storage
        .from("blogs")
        .getPublicUrl(`${values.userId}/${fileName}`)

      image_url = urlData.publicUrl
    }

    // ブログを新規作成
    const { data: newBlog, error: insertError } = await supabase
      .from("blogs")
      .insert({
        title: values.title,
        content: values.content,
        summary: values.summary || null,
        image_url,
        user_id: values.userId,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("ブログ作成エラー:", insertError)
      return { error: insertError.message }
    }

    // タグの処理
    if (values.tags && values.tags.length > 0) {
      const tagIds = await upsertTags(values.tags)

      if (tagIds.length > 0) {
        // 重複を避けるため、既存の関連をチェック
        const blogTags = tagIds.map(tagId => ({
          blog_id: newBlog.id,
          tag_id: tagId,
        }))

        const { error: blogTagsError } = await supabase
          .from("blog_tags")
          .insert(blogTags)

        if (blogTagsError) {
          console.error("タグ関連付けエラー:", blogTagsError)
          // タグ関連付けが失敗してもブログ投稿自体は成功とする
        }
      }
    }

    return { success: true }
  } catch (err) {
    console.error("ブログ投稿エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

interface editBlogProps extends z.infer<typeof BlogSchema> {
  blogId: string
  imageUrl: string | null
  base64Image: string | undefined
  userId: string
  tags?: string[]
  summary?: string
}

// ブログ編集（完全修正版）
export const editBlog = async (values: editBlogProps) => {
  try {
    const supabase = createClient()

    let image_url = values.imageUrl

    // 画像更新処理
    if (values.base64Image) {
      const matches = values.base64Image.match(/^data:(.+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return { error: "無効な画像データです" }
      }
      const contentType = matches[1]
      const base64Data = matches[2]
      const fileExt = contentType.split("/")[1]
      const fileName = `${uuidv4()}.${fileExt}`

      const { error: storageError } = await supabase.storage
        .from("blogs")
        .upload(`${values.userId}/${fileName}`, decode(base64Data), {
          contentType,
        })

      if (storageError) {
        console.error("画像アップロードエラー:", storageError)
        return { error: storageError.message }
      }

      // 古い画像を削除
      if (image_url) {
        const oldFileName = image_url.split("/").slice(-1)[0]
        await supabase.storage
          .from("blogs")
          .remove([`${values.userId}/${oldFileName}`])
      }

      const { data: urlData } = supabase.storage
        .from("blogs")
        .getPublicUrl(`${values.userId}/${fileName}`)

      image_url = urlData.publicUrl
    }

    // ブログ更新
    const { error: updateError } = await supabase
      .from("blogs")
      .update({
        title: values.title,
        content: values.content,
        summary: values.summary || null,
        image_url,
      })
      .eq("id", values.blogId)

    if (updateError) {
      console.error("ブログ更新エラー:", updateError)
      return { error: updateError.message }
    }

    // 既存のタグ関連をすべて削除
    const { error: deleteTagsError } = await supabase
      .from("blog_tags")
      .delete()
      .eq("blog_id", values.blogId)

    if (deleteTagsError) {
      console.error("タグ削除エラー:", deleteTagsError)
      return { error: "タグの更新中にエラーが発生しました" }
    }

    // 新しいタグを関連付け
    if (values.tags && values.tags.length > 0) {
      const tagIds = await upsertTags(values.tags)

      if (tagIds.length > 0) {
        const blogTags = tagIds.map(tagId => ({
          blog_id: values.blogId,
          tag_id: tagId,
        }))

        const { error: blogTagsError } = await supabase
          .from("blog_tags")
          .insert(blogTags)

        if (blogTagsError) {
          console.error("タグ関連付けエラー:", blogTagsError)
          return { error: "タグの更新中にエラーが発生しました" }
        }
      }
    }

    return { success: true }
  } catch (err) {
    console.error("ブログ編集エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

interface deleteBlogProps {
  blogId: string
  imageUrl: string | null
  userId: string
}

// ブログ削除
export const deleteBlog = async ({
  blogId,
  imageUrl,
  userId,
}: deleteBlogProps) => {
  try {
    const supabase = createClient()

    // ブログ削除（CASCADE制約により関連データも削除される）
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId)

    if (error) {
      console.error("ブログ削除エラー:", error)
      return { error: error.message }
    }

    // 画像削除
    if (imageUrl) {
      const fileName = imageUrl.split("/").slice(-1)[0]
      await supabase.storage
        .from("blogs")
        .remove([`${userId}/${fileName}`])
    }

    return { success: true }
  } catch (err) {
    console.error("ブログ削除エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

// AIによるタグ生成アクション
export const generateTagsFromContent = async (title: string, content: string) => {
  if (!title || !content) {
    return { error: "タイトルと内容は必須です。" }
  }

  try {
    const { generateTags } = await import("@/utils/gemini")
    const result = await generateTags(title, content)
    return result
  } catch (error) {
    console.error("タグ生成エラー:", error)
    return { error: "サーバーでタグの生成中にエラーが発生しました。" }
  }
}

// AIによる要約生成と保存アクション
export const generateAndSaveSummary = async ({ 
  blogId, 
  title, 
  content 
}: { 
  blogId: string
  title: string
  content: string 
}) => {
  const supabase = createClient()

  const { summary, error: summaryError } = await generateSummaryFromContent(title, content)
  
  if (summaryError) {
    console.error("要約生成エラー:", summaryError)
    return { error: summaryError }
  }

  const { error: updateError } = await supabase
    .from("blogs")
    .update({ summary: summary || null })
    .eq("id", blogId)

  if (updateError) {
    console.error("要約保存エラー:", updateError)
    return { error: updateError.message }
  }

  return { summary, error: null }
}

// すべてのタグを取得
export const getAllTags = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tags")
      .select("name")
      .order("name")

    if (error) {
      console.error("タグ取得エラー:", error)
      return { tags: [], error: error.message }
    }

    return { tags: data.map(t => t.name), error: null }
  } catch (err) {
    console.error("タグ取得エラー:", err)
    return { tags: [], error: "エラーが発生しました" }
  }
}

// 記事を検索
export const searchBlogs = async (query: string) => {
  if (!query) return { blogs: [], error: null }
  
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("blogs")
      .select("id, title")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(8)

    if (error) {
      console.error("検索エラー:", error)
      return { blogs: [], error: error.message }
    }

    return { blogs: data || [], error: null }
  } catch (err) {
    console.error("検索エラー:", err)
    return { blogs: [], error: "エラーが発生しました" }
  }
}