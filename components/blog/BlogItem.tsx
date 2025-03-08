"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Clock, ChevronRight } from "lucide-react"
import { BlogType } from "@/types"
import { formatJST } from "@/utils/date"
import { motion, AnimatePresence } from "framer-motion"

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

  return (
    <div className="relative transform-gpu">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ 
          transformOrigin: "center",
          perspective: "1000px"
        }}
      >
        <Card 
          className="relative w-full overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            animate={{
              scale: isHovered ? 1.01 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.5
            }}
            style={{ 
              transformOrigin: "center",
              transformStyle: "preserve-3d"
            }}
          >
            <Link href={`blog/${blog.id}`} className="block overflow-hidden">
              <div className="relative w-full aspect-video">
                <Image
                  src={blog.image_url || "/noImage.png"}
                  alt="Blog cover image"
                  fill
                  className="object-cover"
                  style={{
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transformOrigin: "center center"
                  }}
                  priority
                />
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ 
                      y: isHovered ? 0 : 20,
                      opacity: isHovered ? 1 : 0 
                    }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white"
                  >
                    <span className="text-sm font-medium">続きを読む</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </div>
            </Link>

            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1.5 py-1.5"
                >
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{formatJST(blog.updated_at)}</span>
                </Badge>
                <motion.div 
                  className="flex items-center gap-1.5"
                  animate={{
                    scale: isHovered ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.4,
                    times: [0, 0.5, 1],
                  }}
                >
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">
                    {blog.likes_count || 0}
                  </span>
                </motion.div>
              </div>

              <Link href={`blog/${blog.id}`}>
                <motion.h3
                  animate={{
                    color: isHovered 
                      ? "hsl(var(--primary))" 
                      : "hsl(var(--foreground))"
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-bold line-clamp-2 leading-tight mb-2"
                >
                  {blog.title}
                </motion.h3>
              </Link>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {blog.content 
                        ? blog.content
                            .replace(/#{1,6} |\*\*|\*|`|>|---|___|\|/g, '')
                            .substring(0, 150) + '...' 
                        : 'この記事を読む'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 pt-2">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: isHovered ? 1.05 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    className="relative z-10"
                  >
                    <Image
                      src={blog.profiles.avatar_url || "/default.png"}
                      alt="Author avatar"
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-background"
                    />
                  </motion.div>
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isHovered ? 1.15 : 1,
                      opacity: isHovered ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    style={{ transformOrigin: "center" }}
                  />
                </div>
                <motion.span
                  animate={{
                    x: isHovered ? 3 : 0
                  }}
                  className="text-sm font-medium text-foreground/80"
                >
                  {blog.profiles.name}
                </motion.span>
              </div>
            </CardContent>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}

export default BlogItem