import * as z from "zod"

export const BlogSchema = z.object({
  title: z.string().min(1, { message: "タイトルは必須です" }).max(100, { message: "タイトルは100文字以内で入力してください" }),
  content: z.string().min(10, { message: "内容は10文字以上必要です" }).max(5000, { message: "内容は5000文字以内で入力してください" })
})

export interface SocialLinksType {
  twitter?: string
  github?: string
  linkedin?: string
  instagram?: string
  facebook?: string
}

export interface ProfileType {
  id: string
  name: string
  introduce: string | null
  avatar_url: string | null
  email?: string | null
  website?: string | null
  created_at?: string
  updated_at?: string
  social_links?: SocialLinksType
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
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export interface LikeType {
  id: string
  blog_id: string
  user_id: string
  created_at: string
}

export interface BookmarkType {
  id: string
  blog_id: string
  user_id: string
  created_at: string
}

export interface ReactionType {
  emoji: string
  count: number
  reacted: boolean
}

export interface CommentType {
  id: string
  blog_id: string
  user_id: string
  parent_id: string | null
  content: string
  user_name: string
  user_avatar_url: string | null
  created_at: string
  updated_at: string
  reactions: ReactionType[]
}

export interface GenerationOptions {
  keepStructure: boolean;
  preserveLinks: boolean;
  enhanceReadability: boolean;
  summaryLength?: 'short' | 'medium' | 'long';
}