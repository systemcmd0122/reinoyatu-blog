"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { BlogType } from "@/types"
import { formatJST } from "@/utils/date"

interface BlogItemProps {
  blog: BlogType & {
    profiles: {
      name: string
      avatar_url: string
    }
    likes_count: number
  }
}

const BlogItem: React.FC<BlogItemProps> = ({ blog }) => {
  // ホバー状態を管理するstate
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card 
      className="w-full max-w-full overflow-hidden transition-all duration-500 hover:shadow-xl group"
      style={{ 
        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`blog/${blog.id}`}>
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={blog.image_url || "/noImage.png"}
            alt="Blog cover image"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </Link>

      <CardContent className="p-4 space-y-3 transition-all duration-500">
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs">
            {formatJST(blog.updated_at)}
          </Badge>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 text-red-500 group-hover:animate-pulse" />
            <span className="text-xs text-muted-foreground">{blog.likes_count || 0}</span>
          </div>
        </div>

        <Link href={`blog/${blog.id}`}>
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
        </Link>

        {/* コンテンツのプレビュー - ホバー時のみ表示 */}
        <div 
          className={`overflow-hidden transition-all duration-500 ${
            isHovered ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <p className="text-sm text-muted-foreground line-clamp-3">
            {blog.content ? blog.content.replace(/#{1,6} |\*\*|\*|`|>|---|___|\|/g, '').substring(0, 150) + '...' : 'この記事を読む'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Image
              src={blog.profiles.avatar_url || "/default.png"}
              alt="Author avatar"
              width={40}
              height={40}
              className="rounded-full border-2 border-gray-200 shrink-0 transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 rounded-full border-2 border-primary scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {blog.profiles.name}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BlogItem