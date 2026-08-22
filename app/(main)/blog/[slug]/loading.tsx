"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12 animate-pulse">
        {/* Back link */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground/30">
          <ChevronLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-28 rounded-full" />
        </div>

        {/* Cover Image Skeleton */}
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />

        {/* Title */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-3/5 rounded-xl" />
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2.5 flex-1">
            <Skeleton className="h-4 w-36 rounded-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24 rounded-full opacity-60" />
              <Skeleton className="h-3 w-20 rounded-full opacity-60" />
              <Skeleton className="h-3 w-16 rounded-full opacity-60" />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>

        {/* Summary Skeleton */}
        <div className="p-6 rounded-2xl bg-muted/20 border border-border/50">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-full opacity-60" />
            <Skeleton className="h-4 w-full rounded-full opacity-60" />
            <Skeleton className="h-4 w-3/5 rounded-full opacity-60" />
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-12">
          {[1, 2].map((section) => (
            <div key={section} className="space-y-6">
              <Skeleton className="h-8 w-56 rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-11/12 rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-4/5 rounded-full opacity-70" />
                <Skeleton className="h-4 w-3/4 rounded-full opacity-70" />
              </div>
            </div>
          ))}

          {/* Blockquote */}
          <div className="p-6 border-l-4 border-muted rounded-r-2xl bg-muted/10 space-y-3">
            <Skeleton className="h-4 w-full rounded-full opacity-50" />
            <Skeleton className="h-4 w-11/12 rounded-full opacity-50" />
            <Skeleton className="h-4 w-4/5 rounded-full opacity-50" />
          </div>

          {[1].map((section) => (
            <div key={section} className="space-y-6">
              <Skeleton className="h-8 w-72 rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-full rounded-full opacity-70" />
                <Skeleton className="h-4 w-3/4 rounded-full opacity-70" />
                <Skeleton className="h-4 w-5/6 rounded-full opacity-70" />
              </div>
            </div>
          ))}
        </div>

        {/* Author card skeleton */}
        <div className="border-t border-border/50 pt-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full opacity-60" />
              <Skeleton className="h-4 w-3/4 rounded-full opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
