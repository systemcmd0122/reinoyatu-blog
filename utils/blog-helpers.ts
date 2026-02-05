import { BlogType } from "@/types"
import { formatBlogDate } from "./date"

/**
 * ブログ記事オブジェクトから表示に必要な情報を標準化して抽出する
 */
export const getBlogDisplayData = (blog: BlogType) => {
  const {
    title,
    summary,
    image_url,
    is_published,
    created_at,
    updated_at,
    likes_count,
    profiles,
    tags
  } = blog

  return {
    id: blog.id,
    title: title || "無題の記事",
    summary: summary || "",
    imageUrl: image_url,
    isPublished: !!is_published,
    dateDisplay: formatBlogDate(created_at, updated_at, !!is_published),
    likesCount: likes_count || 0,
    author: {
      id: profiles?.id,
      name: profiles?.name || "不明なユーザー",
      avatarUrl: profiles?.avatar_url || "/default.png"
    },
    tags: tags?.map(t => t.name) || []
  }
}
