import React from "react"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { BlogType } from "@/types"

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
  return (
    <Card className="w-full max-w-full overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link href={`blog/${blog.id}`}>
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={blog.image_url || "/noImage.png"}
            alt="Blog cover image"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs">
            {format(new Date(blog.updated_at), "yyyy/MM/dd HH:mm")}
          </Badge>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">{blog.likes_count || 0}</span>
          </div>
        </div>

        <Link href={`blog/${blog.id}`}>
          <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
            {blog.title}
          </h3>
        </Link>

        <div className="flex items-center space-x-3">
          <Image
            src={blog.profiles.avatar_url || "/default.png"}
            alt="Author avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-gray-200 shrink-0"
          />
          <div className="text-sm text-muted-foreground truncate">
            {blog.profiles.name}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BlogItem