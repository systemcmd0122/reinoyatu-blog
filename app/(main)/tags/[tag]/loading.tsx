"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Tag } from "lucide-react"
import { BlogListSkeleton } from "@/components/blog/BlogListSkeleton"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <main className="flex-1 min-w-0 animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-10 space-y-4">
              <Skeleton className="h-4 w-24 rounded-full" />
              <div className="flex items-center gap-4">
                <div className="p-4 bg-muted rounded-[1.25rem]">
                  <Tag className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-10 w-48 rounded-xl" />
                  <Skeleton className="h-4 w-24 rounded-full opacity-60" />
                </div>
              </div>
            </div>

            {/* Tab Navigation Skeleton */}
            <div className="bg-card/50 border border-border/50 rounded-2xl flex items-center px-2 h-14 mb-8">
              <div className="h-10 bg-primary/10 px-6 rounded-xl flex items-center">
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <div className="px-6 flex items-center">
                <Skeleton className="h-4 w-16 rounded-full opacity-40" />
              </div>
            </div>

            <BlogListSkeleton count={5} />
          </main>

          <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-6 animate-pulse">
            <div className="bg-card/40 border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border/40 bg-muted/20">
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
              <div className="p-6 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-8 w-16 rounded-lg opacity-40" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  )
}
