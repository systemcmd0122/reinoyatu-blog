"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {/* Hero Section Skeleton */}
        <section className="mb-20">
          <div className="max-w-4xl space-y-8 animate-pulse">
            {/* Tagline */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary/20" />
              </div>
              <Skeleton className="h-4 w-48 rounded-full" />
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-full rounded-full opacity-60" />
              <Skeleton className="h-5 w-full rounded-full opacity-60" />
              <Skeleton className="h-5 w-2/3 rounded-full opacity-60" />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Skeleton className="h-14 w-44 rounded-2xl" />
              <Skeleton className="h-14 w-44 rounded-2xl" />
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="mb-20">
          <div className="space-y-8 animate-pulse">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-40 rounded-full" />
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {/* Featured Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-6 bg-card/40 p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
                  <Skeleton className="aspect-[16/9] w-full rounded-[1.5rem]" />
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-8 w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded-full opacity-60" />
                      <Skeleton className="h-4 w-5/6 rounded-full opacity-60" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24 rounded-full" />
                      <Skeleton className="h-2 w-16 rounded-full opacity-50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Articles Section */}
        <section>
          <div className="space-y-8 animate-pulse">
             <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-48 rounded-full" />
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {/* Article Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card/30 rounded-[2rem] border border-border/40 overflow-hidden p-5 space-y-5 shadow-sm">
                  <Skeleton className="aspect-video w-full rounded-[1.25rem]" />
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-20 rounded-full" />
                    <Skeleton className="h-6 w-full rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-full rounded-full opacity-60" />
                      <Skeleton className="h-3 w-2/3 rounded-full opacity-60" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
