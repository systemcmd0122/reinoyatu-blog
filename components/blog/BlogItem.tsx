"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { formatJST } from "@/utils/date"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BlogItemProps {
  blog: {
    id: string
    title: string
    content: string
    image_url: string
    updated_at: string
    profiles: {
      name: string
      avatar_url: string
    }
  }
  priority?: boolean
}

const BlogItem: React.FC<BlogItemProps> = ({ blog, priority = false }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
    >
      <Link href={`blog/${blog.id}`}>
        <Card className={cn(
          "group relative w-full overflow-hidden",
          "bg-card/50 backdrop-blur-sm",
          "border border-border/50 transition-all duration-300",
          "hover:border-primary/30 hover:shadow-lg",
          "rounded-2xl"
        )}>
          {/* カード画像部分 */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={blog.image_url || "/noImage.png"}
              alt=""
              fill
              className={cn(
                "object-cover transition-all duration-700",
                "group-hover:scale-105",
                !imageLoaded && "blur-2xl scale-105",
                imageLoaded && "blur-0 scale-100"
              )}
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoadingComplete={() => setImageLoaded(true)}
            />
            {/* 多層グラデーションオーバーレイ */}
            <div className={cn(
              "absolute inset-0",
              "bg-gradient-to-t from-black/90 via-black/60 to-black/30",
              "transition-opacity duration-300",
              "opacity-70 group-hover:opacity-80"
            )} />
            
            {/* 追加の保護レイヤー */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
          </div>

          {/* コンテンツ部分 */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white/20">
                  <Image
                    src={blog.profiles.avatar_url || "/default.png"}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-primary/50 to-primary-foreground/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                  {blog.profiles.name}
                </span>
                <span className="text-xs text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  {formatJST(blog.updated_at)}
                </span>
              </div>
            </div>

            <h3 className={cn(
              "text-xl font-bold text-white",
              "line-clamp-2 leading-tight tracking-wide",
              "transition-colors duration-300",
              "drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]",
              "group-hover:text-primary-foreground"
            )}>
              {blog.title}
            </h3>

            {/* アクセントライン */}
            <div className="relative mt-4">
              <div className={cn(
                "h-1 w-12 rounded-full",
                "bg-gradient-to-r from-primary to-primary-foreground/80",
                "transition-all duration-300",
                "group-hover:w-20"
              )} />
              <div className={cn(
                "absolute inset-0 blur-md",
                "bg-gradient-to-r from-primary to-primary-foreground/80",
                "opacity-50 transition-opacity duration-300",
                "group-hover:opacity-100"
              )} />
            </div>
          </div>

          {/* ホバー時のオーバーレイ効果 */}
          <div className={cn(
            "absolute inset-0",
            "bg-gradient-to-t from-primary/20 to-transparent",
            "opacity-0 transition-opacity duration-300",
            "group-hover:opacity-100"
          )} />
        </Card>
      </Link>
    </motion.div>
  )
}

export default BlogItem