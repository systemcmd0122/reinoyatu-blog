export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      blogs: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          introduce: string | null
          avatar_url: string | null
          email: string | null
          website: string | null
          created_at: string
          social_links: {
            twitter?: string
            github?: string
            linkedin?: string
            instagram?: string
            facebook?: string
          } | null
        }
        Insert: {
          id: string
          name: string
          introduce?: string | null
          avatar_url?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          social_links?: {
            twitter?: string
            github?: string
            linkedin?: string
            instagram?: string
            facebook?: string
          } | null
        }
        Update: {
          id?: string
          name?: string
          introduce?: string | null
          avatar_url?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          social_links?: {
            twitter?: string
            github?: string
            linkedin?: string
            instagram?: string
            facebook?: string
          } | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}