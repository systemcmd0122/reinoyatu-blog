import { z } from "zod"

export const BlogSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().min(1, "内容は必須です"),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().default(false),
})

export type BlogSchemaType = z.infer<typeof BlogSchema>

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
  summary: string | null
  user_id: string
  image_url: string | null
  is_published: boolean
  updated_at: string
  created_at: string
  likes_count?: number
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
  tags?: { name: string }[]
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