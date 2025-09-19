"use server"

import { BlogSchema } from "@/schemas"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { decode } from "base64-arraybuffer"
import { generateSummaryFromContent } from "@/utils/gemini"

// タグをDBに保存し、IDを返すヘルパー関数
const upsertTags = async (tagNames: string[]) => {
  const supabase = createClient()
  const cleanedTagNames = tagNames.map(name => name.trim()).filter(Boolean)

  if (cleanedTagNames.length === 0) {
    return []
  }

  // タグが存在しない場合は作成
  const { data: tags, error: upsertError } = await supabase
    .from("tags")
    .upsert(
      cleanedTagNames.map(name => ({ name })),
      { onConflict: "name" }
    )
    .select("id")

  if (upsertError) {
    console.error("Error upserting tags:", upsertError)
    return []
  }

  return tags.map(tag => tag.id)
}

interface newBlogProps extends z.infer<typeof BlogSchema> {
  base64Image: string | undefined
  userId: string
  tags?: string[]
  summary?: string // summaryを追加
}

// ブログ投稿
export const newBlog = async (values: newBlogProps) => {
  try {
    const supabase = createClient()

    let image_url = ""

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
        return { error: storageError.message }
      }

      const { data: urlData } = supabase.storage
        .from("blogs")
        .getPublicUrl(`${values.userId}/${fileName}`)

      image_url = urlData.publicUrl
    }

    // ブログを新規作成し、IDを取得
    const { data: newBlog, error: insertError } = await supabase
      .from("blogs")
      .insert({
        title: values.title,
        content: values.content,
        summary: values.summary || null, // フォームから受け取る
        image_url,
        user_id: values.userId,
      })
      .select("id")
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    // タグの処理
    if (values.tags && values.tags.length > 0) {
      const tagIds = await upsertTags(values.tags)

      if (tagIds.length > 0) {
        const blogTags = tagIds.map(tagId => ({
          blog_id: newBlog.id,
          tag_id: tagId,
        }))
        const { error: blogTagsError } = await supabase
          .from("blog_tags")
          .insert(blogTags)

        if (blogTagsError) {
          console.error("Error inserting blog tags:", blogTagsError)
          // ここではエラーを返さず、ブログ投稿自体は成功として扱う
        }
      }
    }

  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

interface editBlogProps extends z.infer<typeof BlogSchema> {
  blogId: string
  imageUrl: string | null
  base64Image: string | undefined
  userId: string
  tags?: string[]
  summary?: string // summaryを追加
}

// ブログ編集
export const editBlog = async (values: editBlogProps) => {
  try {
    const supabase = createClient()

    let image_url = values.imageUrl

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
        return { error: storageError.message }
      }

      if (image_url) {
        const oldFileName = image_url.split("/").slice(-1)[0]
        await supabase.storage.from("blogs").remove([`${values.userId}/${oldFileName}`])
      }

      const { data: urlData } = supabase.storage
        .from("blogs")
        .getPublicUrl(`${values.userId}/${fileName}`)

      image_url = urlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from("blogs")
      .update({
        title: values.title,
        content: values.content,
        summary: values.summary || null, // フォームから受け取る
        image_url,
      })
      .eq("id", values.blogId)

    if (updateError) {
      return { error: updateError.message }
    }

    // タグの処理
    // 既存のタグ関連をすべて削除
    const { error: deleteTagsError } = await supabase
      .from("blog_tags")
      .delete()
      .eq("blog_id", values.blogId)

    if (deleteTagsError) {
      console.error("Error deleting old blog tags:", deleteTagsError)
      return { error: "タグの更新中にエラーが発生しました" }
    }

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
          console.error("Error inserting new blog tags:", blogTagsError)
          return { error: "タグの更新中にエラーが発生しました" }
        }
      }
    }

  } catch (err) {
    console.error(err)
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

    // 関連する画像も一緒に削除される（CASCADE制約による）
    const { error } = await supabase.from("blogs").delete().eq("id", blogId)

    if (error) {
      return { error: error.message }
    }

    if (!imageUrl) {
      return
    }

    const fileName = imageUrl.split("/").slice(-1)[0]
    await supabase.storage.from("blogs").remove([`${userId}/${fileName}`])

  } catch (err) {
    console.error(err)
    return { error: "エラーが発生しました" }
  }
}

// AIによるタグ生成アクション
export const generateTagsFromContent = async (title: string, content: string) => {
  console.log("Checking server-side environment variable NEXT_PUBLIC_GEMINI_API_KEY:", process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Loaded" : "NOT LOADED");
  if (!title || !content) {
    return { error: "タイトルと内容は必須です。" };
  }

  try {
    const { generateTags } = await import("@/utils/gemini");
    const result = await generateTags(title, content);
    return result;
  } catch (error) {
    console.error("Error in generateTagsFromContent action:", error);
    return { error: "サーバーでタグの生成中にエラーが発生しました。" };
  }
};

// AIによる要約生成と保存アクション
export const generateAndSaveSummary = async ({ blogId, title, content }: { blogId: string, title: string, content: string }) => {
  const supabase = createClient();

  const { summary, error: summaryError } = await generateSummaryFromContent(title, content);
  if (summaryError) {
    console.error("AI summary generation failed:", summaryError);
    return { error: summaryError };
  }

  const { error: updateError } = await supabase
    .from("blogs")
    .update({ summary: summary || null })
    .eq("id", blogId);

  if (updateError) {
    console.error("Error updating summary in DB:", updateError);
    return { error: updateError.message };
  }

  return { summary, error: null };
};
