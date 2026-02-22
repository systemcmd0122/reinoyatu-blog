import { Skeleton } from "@/components/ui/skeleton"

interface BlogListSkeletonProps {
  count?: number
}

export const BlogListSkeleton = ({ count = 5 }: BlogListSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-5 md:p-6 flex gap-4 md:gap-6">
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-6 w-12 rounded-md" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            </div>
          </div>
          <Skeleton className="h-24 w-32 md:h-32 md:w-48 rounded-xl shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  )
}
