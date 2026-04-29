"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8 lg:py-12 animate-pulse"
    >
      <div className="flex flex-col md:flex-row gap-10 lg:gap-14">
        {/* Sidebar Skeleton (Matching SettingsLayout) */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
          <div className="space-y-8">
            <div className="flex items-center space-x-3 px-4 pb-6 border-b border-border/50">
              <Skeleton className="h-6 w-6 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>

            {[1, 2, 3].map((group) => (
              <div key={group} className="space-y-4">
                <Skeleton className="h-3 w-24 mx-4 rounded-full opacity-50" />
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start px-4 py-3 gap-4">
                      <Skeleton className="h-5 w-5 rounded-md shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-2 w-full rounded-full opacity-50" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area Skeleton */}
        <main className="flex-1 min-w-0">
          <div className="bg-card rounded-[2rem] p-8 lg:p-12 border border-border/60 shadow-sm space-y-10">
            {/* Header */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-5 w-full max-w-md rounded-full opacity-60" />
            </div>

            <div className="space-y-8 pt-8 border-t border-border/40">
              {[1, 2, 3].map((field) => (
                <div key={field} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full opacity-50" />
                  </div>
                  <Skeleton className="h-14 w-full rounded-[1.25rem] bg-muted/20" />
                </div>
              ))}
            </div>

            <div className="pt-10 flex flex-col sm:flex-row justify-end gap-4">
              <Skeleton className="h-12 w-full sm:w-32 rounded-xl" />
              <Skeleton className="h-12 w-full sm:w-44 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  )
}
