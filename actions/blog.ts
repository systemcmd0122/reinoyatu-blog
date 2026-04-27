"use server"

import { BlogSchema, ActionResponse } from "@/schemas"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { uploadImage, syncArticleImages, cleanupUnusedImages } from "./image"
import { validateUser } from "@/utils/image-helpers"

// タグをDBに保存し、IDを返すヘルパー関数
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

  // 既存のタグを一括検索
  const { data: existingTags, error: searchError } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", cleanedTagNames)

  if (searchError) {
    console.error("タグ一括検索エラー:", searchError)
  }

  const existingTagNames = existingTags?.map(t => t.name) || []
  const existingTagIds = existingTags?.map(t => t.id) || []

  // 新規に作成が必要なタグ名
  const newTagNames = cleanedTagNames.filter(name => !existingTagNames.includes(name))

  let newTagIds: string[] = []
  if (newTagNames.length > 0) {
    const { data: createdTags, error: insertError } = await supabase
      .from("tags")
      .insert(newTagNames.map(name => ({ name })))
      .select("id")

    if (insertError) {
      console.error("タグ一括作成エラー:", insertError)
      // 競合等で失敗した場合は、再度全検索して確実にIDを取得する
      const { data: allTags } = await supabase
        .from("tags")
        .select("id")
        .in("name", cleanedTagNames)
      return allTags?.map(t => t.id) || []
    }

    newTagIds = createdTags?.map(t => t.id) || []
  }

  return [...existingTagIds, ...newTagIds]
}

interface newBlogProps extends z.infer<typeof BlogSchema> {
  base64Image?: string
  imageUrl?: string | null
  userId: string
  tags?: string[]
  summary?: string
  is_published?: boolean
}

// URLのバリデーション用ヘルパー
const isValidImageUrl = (url: string | null) => {
  if (!url) return true; // nullは許容（画像なし）
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// ブログ投稿
export const newBlog = async (values: newBlogProps): Promise<ActionResponse> => {
  try {
    const user = await validateUser()
    const supabase = createClient()

    const validatedFields = BlogSchema.safeParse(values)
    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.errors[0].message }
    }

    let image_url = values.imageUrl || null

    // 画像アップロード処理
    if (values.base64Image) {
      const result = await uploadImage(values.base64Image)
      if (result.error) {
        return { success: false, error: result.error }
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
      return { success: false, error: insertError.message }
    }

    // 共同投稿者の保存
    const uniqueCoAuthorIds = [...new Set(values.coauthors || [])].filter(id => id !== values.userId)
    const authors = [
      { article_id: newBlog.id, user_id: values.userId, role: 'owner' as const },
      ...uniqueCoAuthorIds.map(id => ({
        article_id: newBlog.id,
        user_id: id,
        role: 'editor' as const
      }))
    ]

    const { error: authorsError } = await supabase
      .from("article_authors")
      .insert(authors)

    if (authorsError) {
      console.error("共同投稿者保存エラー:", authorsError)
    }

    // 画像の関連付けを同期
    await syncArticleImages(newBlog.id, values.content_json || "", image_url)

    revalidatePath("/")
    revalidatePath(`/blog/${newBlog.id}`)
    revalidatePath(`/profile/${values.userId}`)

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
  } catch (err: any) {
    console.error("ブログ投稿エラー詳細:", {
      message: err.message,
      stack: err.stack,
      values: { ...values, base64Image: values.base64Image ? "present" : "absent" }
    })
    return { success: false, error: err.message || "エラーが発生しました" }
  }
}

interface editBlogProps extends z.infer<typeof BlogSchema> {
  blogId: string
  imageUrl: string | null | undefined
  base64Image?: string
  userId: string
  tags?: string[]
  summary?: string
  is_published?: boolean
}

// ブログ編集
export const editBlog = async (values: editBlogProps): Promise<ActionResponse> => {
  try {
    const user = await validateUser()
    const supabase = createClient()

    const validatedFields = BlogSchema.safeParse(values)
    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.errors[0].message }
    }

    // 権限チェック
    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .select("user_id")
      .eq("id", values.blogId)
      .single()

    if (blogError || !blog) {
      return { success: false, error: "記事が見つかりません" }
    }

    // 共同投稿者かどうかもチェック
    const { data: coauthor } = await supabase
      .from("article_authors")
      .select("role")
      .eq("article_id", values.blogId)
      .eq("user_id", user.id)
      .single()

    if (blog.user_id !== user.id && !coauthor) {
      return { success: false, error: "編集権限がありません" }
    }

    let image_url = values.imageUrl
    let shouldUpdateImage = false

    // 画像更新処理
    if (values.base64Image) {
      const result = await uploadImage(values.base64Image)
      if (result.error) {
        return { success: false, error: result.error }
      }
      image_url = result.data.public_url
      shouldUpdateImage = true
    } else if (image_url !== undefined) {
      // image_url が null の場合は削除、文字列の場合はURL更新
      // undefined 以外が渡された場合は何らかの変更があったとみなす
      shouldUpdateImage = true
    }
    // undefined の場合は、既存の画像を保持するため、更新しない

    // ブログ更新 - 画像が変更されていない場合は image_url フィールドを除外
    const updateData: any = {
      title: values.title,
      content: values.content,
      content_json: values.content_json || null,
      summary: values.summary || null,
      is_published: values.is_published,
    }

    if (shouldUpdateImage) {
      updateData.image_url = image_url
    }

    const { error: updateError } = await supabase
      .from("blogs")
      .update(updateData)
      .eq("id", values.blogId)

    if (updateError) {
      console.error("ブログ更新エラー:", updateError)
      return { success: false, error: updateError.message }
    }

    // 共同投稿者の更新（差分更新）
    const { data: currentAuthors } = await supabase
      .from("article_authors")
      .select("user_id, role")
      .eq("article_id", values.blogId)

    const currentAuthorIds = currentAuthors?.map(a => a.user_id) || []
    const uniqueCoAuthorIds = [...new Set(values.coauthors || [])].filter(id => id !== values.userId)
    const allNewAuthorIds = [values.userId, ...uniqueCoAuthorIds]

    // 削除すべき著者
    const authorsToDelete = currentAuthorIds.filter(id => !allNewAuthorIds.includes(id))
    if (authorsToDelete.length > 0) {
      await supabase
        .from("article_authors")
        .delete()
        .eq("article_id", values.blogId)
        .in("user_id", authorsToDelete)
    }

    // 追加すべき著者
    const authorsToInsert = allNewAuthorIds
      .filter(id => !currentAuthorIds.includes(id))
      .map(id => ({
        article_id: values.blogId,
        user_id: id,
        role: (id === values.userId ? 'owner' : 'editor') as 'owner' | 'editor'
      }))

    if (authorsToInsert.length > 0) {
      await supabase
        .from("article_authors")
        .insert(authorsToInsert)
    }

    // 画像の関連付けを同期
    await syncArticleImages(values.blogId, values.content_json || "", image_url ?? null)

    revalidatePath("/")
    revalidatePath(`/blog/${values.blogId}`)
    revalidatePath(`/profile/${values.userId}`)

    // タグの処理（差分更新）
    const tagIds = await upsertTags(values.tags || [])

    const { data: currentBlogTags } = await supabase
      .from("blog_tags")
      .select("tag_id")
      .eq("blog_id", values.blogId)

    const currentTagIds = currentBlogTags?.map(t => t.tag_id) || []

    const tagsToDelete = currentTagIds.filter(id => !tagIds.includes(id))
    const tagsToInsert = tagIds.filter(id => !currentTagIds.includes(id))

    if (tagsToDelete.length > 0) {
      await supabase
        .from("blog_tags")
        .delete()
        .eq("blog_id", values.blogId)
        .in("tag_id", tagsToDelete)
    }

    if (tagsToInsert.length > 0) {
      const blogTagsToInsert = tagsToInsert.map(tagId => ({
        blog_id: values.blogId,
        tag_id: tagId,
      }))

      const { error: blogTagsError } = await supabase
        .from("blog_tags")
        .insert(blogTagsToInsert)

      if (blogTagsError) {
        console.error("タグ関連付けエラー:", blogTagsError)
        return { success: false, error: "タグの更新中にエラーが発生しました" }
      }
    }

    return { success: true }
  } catch (err: any) {
    const user = await validateUser().catch(() => null)
    console.error("ブログ編集エラー:", {
      message: err.message,
      blogId: values.blogId,
      userId: user?.id
    })
    return { success: false, error: err.message || "エラーが発生しました" }
  }
}

// 閲覧数を増やす
export const incrementViewCount = async (blogId: string): Promise<ActionResponse> => {
  try {
    const supabase = createClient()
    const { error } = await supabase.rpc('increment_view_count', { blog_id: blogId })
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error("閲覧数更新エラー:", err)
    return { success: false, error: err.message || "エラーが発生しました" }
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
}: deleteBlogProps): Promise<ActionResponse> => {
  try {
    const user = await validateUser()
    const supabase = createClient()

    // 権限チェック
    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .select("user_id")
      .eq("id", blogId)
      .single()

    if (blogError || !blog) {
      return { success: false, error: "記事が見つかりません" }
    }

    if (blog.user_id !== user.id) {
      return { success: false, error: "削除権限がありません" }
    }

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
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    revalidatePath(`/profile/${userId}`)

    // 不要になった画像をクリーンアップ
    if (imageIds.length > 0) {
      await cleanupUnusedImages(imageIds)
    }

    return { success: true }
  } catch (err: any) {
    console.error("ブログ削除エラー:", err)
    return { success: false, error: err.message || "エラーが発生しました" }
  }
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
// 関連記事を取得（同じタグを持つ記事）
export const getRelatedBlogs = async (blogId: string, tags: string[], limit: number = 3) => {
  try {
    const supabase = createClient()

    if (!tags || tags.length === 0) return { blogs: [] }

    const { data, error } = await supabase
      .from("blogs")
      .select(`
        id,
        title,
        summary,
        image_url,
        updated_at,
        view_count,
        profiles!user_id (
          id,
          name,
          avatar_url
        ),
        tags!inner (
          name
        ),
        likes:likes(count)
      `)
      .eq("is_published", true)
      .neq("id", blogId)
      .in("tags.name", tags)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("関連記事取得エラー:", error)
      return { blogs: [], error: error.message }
    }

    const blogsWithLikes = (data || []).map((blog: any) => ({
      ...blog,
      likes_count: blog.likes?.[0]?.count || 0
    }))

    return { blogs: blogsWithLikes, error: null }
  } catch (err) {
    console.error("関連記事取得エラー:", err)
    return { blogs: [], error: "エラーが発生しました" }
  }
}

export const searchBlogs = async (query: string, userId?: string) => {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let q = supabase
      .from("blogs")
      .select("id, title, user_id, is_published")

    if (userId) {
      // 指定されたuserIdの記事を検索する場合、本人の場合のみ下書きも含める
      q = q.eq("user_id", userId)
      if (user?.id !== userId) {
        q = q.eq("is_published", true)
      }
    } else {
      // 一般検索は公開記事のみ
      q = q.eq("is_published", true)
    }

    if (query) {
      q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    }

    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(userId ? 50 : 8)

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
