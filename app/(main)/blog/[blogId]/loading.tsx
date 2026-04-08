import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-20 animate-pulse">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Skeleton */}
          <main className="flex-1 min-w-0">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 sm:p-10 space-y-8">
              {/* Header Skeleton */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              </div>

              {/* Tags Skeleton */}
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-md" />
                ))}
              </div>

              {/* Summary Skeleton */}
              <Skeleton className="h-24 w-full rounded-xl" />

              {/* Image Skeleton */}
              <Skeleton className="aspect-video w-full rounded-2xl" />

              {/* Content Skeleton */}
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
                <Skeleton className="h-4 w-3/4" />
                <div className="py-6">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </main>

          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-[350px] flex-shrink-0 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <Skeleton className="h-12 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
