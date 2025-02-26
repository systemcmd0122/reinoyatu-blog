import * as z from "zod"

export const BlogSchema = z.object({
  title: z.string().min(1, { message: "タイトルは必須です" }).max(100, { message: "タイトルは100文字以内で入力してください" }),
  content: z.string().min(10, { message: "内容は10文字以上必要です" }).max(5000, { message: "内容は5000文字以内で入力してください" })
})

export interface ProfileType {
  id: string
  name: string
  introduce: string | null
  avatar_url: string | null
}

export interface BlogType {
  id: string
  title: string
  content: string
  user_id: string
  image_url: string | null
  updated_at: string
  created_at: string
  likes_count?: number
}

export interface LikeType {
  id: string
  blog_id: string
  user_id: string
  created_at: string
}