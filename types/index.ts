import { z } from "zod"

export const BlogSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().min(1, "内容は必須です"),
  content_json: z.string().optional(),
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
  following_count?: number
  follower_count?: number
}

export interface BlogType {
  id: string
  title: string
  content: string
  content_json: string | null;
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

export interface FollowType {
  follower_id: string
  following_id: string
  created_at: string
}

export interface CollectionType {
  id: string
  user_id: string
  title: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  item_count?: number
}

export interface CollectionItemType {
  id: string
  collection_id: string
  blog_id: string
  order_index: number
  created_at: string
  blogs: BlogType // Supabase join result
}

export interface CollectionWithItemsType extends CollectionType {
  profiles: ProfileType
  collection_items: CollectionItemType[]
}

export interface GenerationOptions {
  keepStructure: boolean;
  preserveLinks: boolean;
  enhanceReadability: boolean;
  summaryLength?: 'short' | 'medium' | 'long';
}