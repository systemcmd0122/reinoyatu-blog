"use client"

import React from "react"
import BlogEditor from "./BlogEditor"
import { editBlog, deleteBlog } from "@/actions/blog"
import { z } from "zod"
import { BlogSchema } from "@/schemas"
import { BlogType } from "@/types"

interface BlogEditProps {
  blog: BlogType
}

const BlogEdit: React.FC<BlogEditProps> = ({ blog }) => {
  const handleSubmit = async (values: z.infer<typeof BlogSchema> & { base64Image?: string }) => {
    return await editBlog({
      ...values,
      blogId: blog.id,
      imageUrl: blog.image_url,
      userId: blog.user_id,
    })
  }

  const handleDelete = async () => {
    return await deleteBlog({
      blogId: blog.id,
      imageUrl: blog.image_url,
      userId: blog.user_id,
    })
  }

  return (
    <BlogEditor
      initialData={blog}
      mode="edit"
      userId={blog.user_id}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}

export default BlogEdit