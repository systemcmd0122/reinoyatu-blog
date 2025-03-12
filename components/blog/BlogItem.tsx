"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Clock, ChevronRight } from "lucide-react"
import { BlogType } from "@/types"
import { formatJST } from "@/utils/date"
import { motion } from "framer-motion"

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
  const [isHovered, setIsHovered] = React.useState(false)

  // ブログ内容のプレビューテキストを生成
  const previewText = React.useMemo(() => {
    if (!blog.content) return 'この記事を読む'
    return blog.content
      .replace(/#{1,6} |\*\*|\*|`|>|---|___|\|/g, '')
      .substring(0, 100) + '...'
  }, [blog.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ y: -5 }}
    >
      <Card 
        className={`
          group relative h-[480px] w-full 
          overflow-hidden bg-card/50 backdrop-blur-sm
          border border-border/50 transition-all duration-300
          hover:border-primary/30 hover:shadow-lg
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`blog/${blog.id}`} className="block h-full">
          <div className="relative h-[240px] w-full">
            <Image
              src={blog.image_url || "/noImage.png"}
              alt="Blog cover image"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              priority
            />
            <div 
              className={`
                absolute inset-0 bg-gradient-to-t 
                from-black/60 via-black/30 to-transparent
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <motion.div
                initial={false}
                animate={{ 
                  y: isHovered ? 0 : 10,
                  opacity: isHovered ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white"
              >
                <span className="text-sm font-medium">続きを読む</span>
                <motion.div
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            </div>
          </div>

          <CardContent className="h-[240px] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1.5 py-1.5 px-3 transition-colors duration-200"
              >
                <Clock className="w-3 h-3" />
                <span className="text-xs">{formatJST(blog.updated_at)}</span>
              </Badge>
              
              <motion.div 
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">
                  {blog.likes_count || 0}
                </span>
              </motion.div>
            </div>

            <h3 className="text-xl font-bold mb-3 line-clamp-2 transition-colors duration-200 group-hover:text-primary">
              {blog.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
              {previewText}
            </p>

            <div className="flex items-center gap-3 mt-auto">
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src={blog.profiles.avatar_url || "/default.png"}
                    alt="Author avatar"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-background"
                  />
                </motion.div>
                {isHovered && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    className="absolute inset-0 rounded-full border-2 border-primary"
                  />
                )}
              </div>
              <motion.span
                animate={{ x: isHovered ? 3 : 0 }}
                className="text-sm font-medium text-foreground/80"
              >
                {blog.profiles.name}
              </motion.span>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  )
}

export default BlogItem