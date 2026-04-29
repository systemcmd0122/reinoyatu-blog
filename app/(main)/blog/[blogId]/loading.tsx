"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12 animate-pulse">
        {/* Cover Image Skeleton */}
        <Skeleton className="aspect-[21/9] w-full rounded-2xl" />

        {/* Header Skeleton */}
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-4/5 rounded-2xl" />
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-4 py-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-24 rounded-full opacity-60" />
                <span className="text-muted-foreground/20">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground/20" />
                  <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-md" />
            ))}
          </div>
        </div>

        {/* Summary Skeleton */}
        <div className="p-8 rounded-2xl bg-muted/20 border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-border/20" />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Skeleton className="h-5 w-5 rounded-md" />
               <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-full opacity-60" />
              <Skeleton className="h-4 w-full rounded-full opacity-60" />
              <Skeleton className="h-4 w-2/3 rounded-full opacity-60" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-10">
          {[1, 2].map((section) => (
            <div key={section} className="space-y-6">
              <Skeleton className="h-8 w-48 rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-5/6 rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-2/3 rounded-full opacity-70" />
              </div>
            </div>
          ))}

          {/* Blockquote Skeleton */}
          <div className="p-8 border-l-4 border-muted rounded-r-2xl bg-muted/10 space-y-3">
             <Skeleton className="h-4 w-full rounded-full italic opacity-50" />
             <Skeleton className="h-4 w-4/5 rounded-full italic opacity-50" />
          </div>

          {[1].map((section) => (
            <div key={section} className="space-y-6">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-3/4 rounded-full opacity-70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
