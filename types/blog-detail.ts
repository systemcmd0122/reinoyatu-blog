export interface NormalizedArticle {
  id: string
  title: string
  content: string
  tags: string[]
  cover_image_url: string | null
  ai_summary: string | null
  author: {
    id: string
    name: string
    avatar_url: string | null
    introduce?: string | null
    social_links?: any
  }
  created_at: string
  updated_at: string
  reading_time: number
  likes_count: number
  is_published: boolean
  user_id: string
}
