"use client"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface BlogSkeletonProps {
  className?: string
}

export function BlogItemSkeleton({ className }: BlogSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton className="h-[200px] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  )
}

export function BlogDetailSkeleton({ className }: BlogSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
      <Skeleton className="h-[300px] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}