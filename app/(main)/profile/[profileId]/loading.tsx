"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-12 pb-24 animate-pulse"
    >
      {/* Header / Hero Section Skeleton */}
      <section className="relative px-4 md:px-0">
        {/* Cover Background */}
        <div className="h-64 md:h-80 w-full bg-muted/40 rounded-[2.5rem] overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-transparent" />
        </div>

        {/* Profile Content */}
        <div className="px-8 md:px-16 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              {/* Avatar */}
              <div className="relative">
                 <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-[3rem]" />
                 <Skeleton className="h-44 w-44 rounded-[3rem] border-8 border-background bg-background relative" />
              </div>

              <div className="text-center md:text-left space-y-5 pb-4">
                <Skeleton className="h-12 w-64 mx-auto md:mx-0 rounded-2xl" />
                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <Skeleton className="h-5 w-32 rounded-full opacity-60" />
                  <Skeleton className="h-5 w-32 rounded-full opacity-60" />
                </div>
              </div>
            </div>

            <div className="pb-4 flex gap-3">
              <Skeleton className="h-12 w-32 rounded-2xl" />
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 md:px-0">
        {/* Sidebar Skeleton */}
        <aside className="lg:col-span-4 space-y-12">
          {/* Stats Card */}
          <div className="bg-card/40 rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden p-8 grid grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center space-y-3">
                <Skeleton className="h-8 w-8 rounded-xl mx-auto opacity-40" />
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-12 mx-auto rounded-lg" />
                  <Skeleton className="h-3 w-16 mx-auto rounded-full opacity-50" />
                </div>
              </div>
            ))}
          </div>

          {/* About Card */}
          <div className="bg-card/40 rounded-[2.5rem] border border-border/50 shadow-sm p-8 space-y-6">
            <Skeleton className="h-5 w-32 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-full opacity-60" />
              <Skeleton className="h-4 w-full rounded-full opacity-60" />
              <Skeleton className="h-4 w-2/3 rounded-full opacity-60" />
            </div>
            <div className="flex gap-2 pt-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-lg opacity-40" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tabs Navigation */}
          <div className="bg-muted/30 p-2 rounded-2xl border border-border/40 flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-xl" />
            ))}
          </div>

          {/* Articles List */}
          <div className="bg-card/30 border border-border/40 rounded-[2.5rem] overflow-hidden divide-y divide-border/40 shadow-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 md:p-10 flex flex-col sm:flex-row gap-8">
                <div className="flex-1 space-y-5">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32 rounded-full opacity-60" />
                    <Skeleton className="h-8 w-full rounded-xl" />
                    <Skeleton className="h-4 w-full rounded-full opacity-60" />
                  </div>
                  <div className="flex gap-4 items-center">
                    <Skeleton className="h-4 w-24 rounded-full opacity-50" />
                    <Skeleton className="h-4 w-24 rounded-full opacity-50" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full sm:w-56 rounded-2xl shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
