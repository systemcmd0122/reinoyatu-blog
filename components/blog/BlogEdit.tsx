"use client"

import React from "react"
import BlogEditor from "./BlogEditor"
import { editBlog, deleteBlog } from "@/actions/blog"
import { z } from "zod"
import { BlogSchema } from "@/schemas"
import { BlogType } from "@/types"
import { useAuth } from "@/hooks/use-auth"

interface BlogEditProps {
  blog: BlogType
}

const BlogEdit: React.FC<BlogEditProps> = ({ blog }) => {
  useAuth()
  
  const handleSubmit = async (values: z.infer<typeof BlogSchema> & { base64Image?: string }) => {
    return await editBlog({
      ...values,
      blogId: blog.id,
      imageUrl: blog.image_url,
      userId: blog.user_id,
      // tags and summary are included in values from BlogSchema
    })
  }

  const handleDelete = async (blogId?: string) => {
    // 引数のblogIdがあればそれを使用し、なければpropsのblog.idを使用
    const idToDelete = blogId || blog.id
    return await deleteBlog({
      blogId: idToDelete,
      imageUrl: blog.image_url,
      userId: blog.user_id,
    })
  }

  return (
    <BlogEditor 
      mode="edit" 
      userId={blog.user_id} 
      initialData={blog}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}

export default BlogEdit
