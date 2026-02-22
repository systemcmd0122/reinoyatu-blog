import { Skeleton } from "@/components/ui/skeleton"
import { BlogListSkeleton } from "@/components/blog/BlogListSkeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>

        <BlogListSkeleton count={5} />
      </div>
    </div>
  )
}
