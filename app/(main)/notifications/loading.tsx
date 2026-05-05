"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto py-10 px-4"
    >
      <div className="flex items-center gap-4 mb-10 animate-pulse">
        <div className="p-3 bg-muted rounded-2xl">
          <Bell className="h-6 w-6 text-muted-foreground/30" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-full" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-4 p-6 hover:bg-muted/5 transition-colors border-b last:border-0">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
