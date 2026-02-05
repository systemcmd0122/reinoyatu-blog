"use client"

import React from "react"
import BlogEditor from "./BlogEditor"
import { newBlog, deleteBlog } from "@/actions/blog"
import { z } from "zod"
import { BlogSchema } from "@/schemas"
import { useAuth } from "@/hooks/use-auth"

interface BlogNewProps {
  userId: string
}

const BlogNew: React.FC<BlogNewProps> = ({ userId }) => {
  useAuth()

  const handleSubmit = async (values: z.infer<typeof BlogSchema> & { base64Image?: string }) => {
    return await newBlog({
      ...values,
      userId,
    })
  }

  // 新規投稿画面でも、一度保存してIDが生成された後は削除可能にするためのハンドラー
  const handleDelete = async (blogId?: string) => {
    if (!blogId) return { error: "IDが見つかりません" }
    return await deleteBlog({
      blogId,
      imageUrl: null, // 新規作成直後は画像URLを個別に追跡していない場合があるが、必要に応じて調整
      userId,
    })
  }

  return (
    <BlogEditor 
      mode="new" 
      userId={userId} 
      onSubmit={handleSubmit}
      onDelete={handleDelete as any} // BlogEditor側でIDを渡すように調整が必要
    />
  )
}

export default BlogNew