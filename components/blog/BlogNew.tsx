"use client"

import React from "react"
import BlogEditor from "./BlogEditor"
import { newBlog } from "@/actions/blog"
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

  return (
    <BlogEditor 
      mode="new" 
      userId={userId} 
      onSubmit={handleSubmit} 
    />
  )
}

export default BlogNew