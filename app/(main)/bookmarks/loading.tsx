"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Bookmark } from "lucide-react"
import { BlogListSkeleton } from "@/components/blog/BlogListSkeleton"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-start justify-between mb-10 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-muted rounded-2xl">
              <Bookmark className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-4 w-64 rounded-full opacity-60" />
            </div>
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>

        <BlogListSkeleton count={5} />
      </div>
    </motion.div>
  )
}
