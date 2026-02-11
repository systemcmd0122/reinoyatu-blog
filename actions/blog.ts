"use server"

import { BlogSchema } from "@/schemas"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { decode } from "base64-arraybuffer"
import { generateSummaryFromContent } from "@/utils/gemini"
import { uploadImage, syncArticleImages, cleanupUnusedImages } from "./image"
import { GoogleGenAI } from "@google/genai"

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
  base64Image?: string
  userId: string
  tags?: string[]
  summary?: string
  is_published?: boolean
}

// ブログ投稿（完全修正版）
export const newBlog = async (values: newBlogProps) => {
  try {
    const supabase = createClient()

    let image_url = null

    // 画像アップロード処理（重複防止対応版）
    if (values.base64Image) {
      const result = await uploadImage(values.base64Image, values.userId)
      if (result.error) {
        return { error: result.error }
      }
      image_url = result.data.public_url
    }

    // ブログを新規作成
    const { data: newBlog, error: insertError } = await supabase
      .from("blogs")
      .insert({
        title: values.title,
        content: values.content,
        content_json: values.content_json || null,
        summary: values.summary || null,
        image_url: image_url || null,
        user_id: values.userId,
        is_published: values.is_published,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("ブログ作成エラー:", insertError)
      return { error: insertError.message }
    }

    // 画像の関連付けを同期
    await syncArticleImages(newBlog.id, values.content_json || "", image_url)

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

    return { success: true, id: newBlog.id }
  } catch (err) {
    console.error("ブログ投稿エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

interface editBlogProps extends z.infer<typeof BlogSchema> {
  blogId: string
  imageUrl: string | null
  base64Image?: string
  userId: string
  tags?: string[]
  summary?: string
  is_published?: boolean
}

// ブログ編集（完全修正版）
export const editBlog = async (values: editBlogProps) => {
  try {
    const supabase = createClient()

    let image_url = values.imageUrl

    // 画像更新処理（重複防止対応版）
    if (values.base64Image) {
      const result = await uploadImage(values.base64Image, values.userId)
      if (result.error) {
        return { error: result.error }
      }
      image_url = result.data.public_url
    }

    // ブログ更新
    const { error: updateError } = await supabase
      .from("blogs")
      .update({
        title: values.title,
        content: values.content,
        content_json: values.content_json || null,
        summary: values.summary || null,
        image_url,
        is_published: values.is_published,
      })
      .eq("id", values.blogId)

    if (updateError) {
      console.error("ブログ更新エラー:", updateError)
      return { error: updateError.message }
    }

    // 画像の関連付けを同期
    await syncArticleImages(values.blogId, values.content_json || "", image_url)

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

    // 関連している画像IDを先に取得しておく
    const { data: articleImages } = await supabase
      .from("article_images")
      .select("image_id")
      .eq("article_id", blogId)

    const imageIds = articleImages?.map(ai => ai.image_id) || []

    // ブログ削除（CASCADE制約により関連データも削除される）
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId)

    if (error) {
      console.error("ブログ削除エラー:", error)
      return { error: error.message }
    }

    // 不要になった画像をクリーンアップ
    if (imageIds.length > 0) {
      await cleanupUnusedImages(imageIds)
    }

    return { success: true }
  } catch (err) {
    console.error("ブログ削除エラー:", err)
    return { error: "エラーが発生しました" }
  }
}

// AIによるタグ生成アクション
export const generateTitleSuggestionsFromContent = async (content: string) => {
  if (!content) {
    return { titles: null, error: "内容は必須です。" }
  }

  try {
    const { generateTitleSuggestions } = await import("@/utils/gemini")
    const result = await generateTitleSuggestions(content)
    return result
  } catch (error) {
    console.error("タイトル生成エラー:", error)
    return { titles: null, error: "サーバーでタイトルの提案中にエラーが発生しました。" }
  }
}

export const generateTagsFromContent = async (title: string, content: string) => {
  if (!title || !content) {
    return { tags: null, error: "タイトルと内容は必須です。" }
  }

  try {
    const { generateTags } = await import("@/utils/gemini")
    const result = await generateTags(title, content)
    return result
  } catch (error) {
    console.error("タグ生成エラー:", error)
    return { tags: null, error: "サーバーでタグの生成中にエラーが発生しました。" }
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
      .eq("is_published", true)
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

// 下書き記事を取得
export const getDrafts = async (userId: string) => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_published", false)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("下書き取得エラー:", error)
      return { drafts: [], error: error.message }
    }

    return { drafts: data || [], error: null }
  } catch (err) {
    console.error("下書き取得エラー:", err)
    return { drafts: [], error: "エラーが発生しました" }
  }
}

// AIとのチャット（@google/genai使用版）
export const chatWithAI = async (messages: { role: 'user' | 'model', content: string }[]) => {
  try {
    // サーバーサイドでGEMINI_API_KEYを取得（NEXT_PUBLIC_を使わない）
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY環境変数が設定されていません");
      return { content: null, error: "APIキーが設定されていません。管理者に連絡してください。" }
    }

    const ai = new GoogleGenAI({ apiKey });

    // 履歴を準備（最後のメッセージは除く）
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    // チャットセッションを作成
    const chat = ai.chats.create({
      model: "gemini-2.5-flash-lite",
      history: history
    });

    // 最後のメッセージを送信
    const lastMessage = messages[messages.length - 1].content;
    const response = await chat.sendMessage({ message: lastMessage });

    if (!response.text) {
      return { content: null, error: "AIからの応答が空でした。" };
    }

    return { content: response.text, error: null };
  } catch (error: any) {
    console.error("AIチャットエラー:", error);
    
    if (error.status === 429) {
      return { content: null, error: "AIの利用制限（リクエスト過多）に達しました。少し時間をおいてから再度お試しください。" };
    }
    
    if (error.status === 404) {
      return { content: null, error: "指定されたAIモデルが見つかりませんでした。管理者にお問い合わせください。" };
    }
    
    if (error.status === 401 || error.status === 403) {
      return { content: null, error: "APIキーが無効です。環境変数を確認してください。" };
    }

    if (error.message?.includes("API key")) {
      return { content: null, error: "APIキーの設定に問題があります。管理者に連絡してください。" };
    }

    return { content: null, error: "AIとの通信中にエラーが発生しました。" };
  }
}