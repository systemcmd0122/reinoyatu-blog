import { Skeleton } from "@/components/ui/skeleton"
import { Tag } from "lucide-react"
import { BlogListSkeleton } from "@/components/blog/BlogListSkeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            {/* Header Skeleton */}
            <div className="mb-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-4">
                <div className="p-4 bg-muted rounded-2xl">
                  <Tag className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>

            {/* Tab Navigation Skeleton */}
            <div className="bg-card border border-border rounded-t-lg flex items-center px-1 h-12 mb-4">
              <div className="h-full border-b-2 border-primary px-6 flex items-center">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="h-full border-b-2 border-transparent px-6 flex items-center">
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            <BlogListSkeleton count={5} />
          </main>

          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
