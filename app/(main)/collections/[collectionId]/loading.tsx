"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Play, Layers } from "lucide-react"
import { motion } from "framer-motion"

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-12 animate-pulse"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Sidebar Skeleton */}
        <div className="lg:col-span-4">
          <div className="space-y-8 bg-card/50 p-8 rounded-[3rem] border border-border/50 shadow-sm">
            <Skeleton className="h-3 w-32 rounded-full" />

            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-muted/40 flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/20" />
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
              
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-2/3 rounded-xl" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-full opacity-60" />
                <Skeleton className="h-4 w-full rounded-full opacity-60" />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>

              <div className="flex flex-col gap-3 pt-8">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <div className="flex gap-3">
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Skeleton */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex items-center justify-between border-b border-border/50 pb-8">
             <div className="flex items-center gap-3">
               <Layers className="h-6 w-6 text-muted-foreground/20" />
               <Skeleton className="h-8 w-48 rounded-xl" />
             </div>
           </div>

           <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex gap-6 p-6 rounded-[2rem] bg-card/40 border border-border/50">
                 <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                 <div className="flex-1 space-y-3 py-1">
                   <Skeleton className="h-6 w-3/4 rounded-xl" />
                   <Skeleton className="h-4 w-32 rounded-full opacity-60" />
                 </div>
                 <Skeleton className="w-10 h-10 rounded-full self-center opacity-30" />
               </div>
             ))}
           </div>
        </div>
      </div>
    </motion.div>
  )
}
