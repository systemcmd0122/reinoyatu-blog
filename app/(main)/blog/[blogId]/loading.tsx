import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Skeleton */}
          <main className="flex-1 min-w-0">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 sm:p-10">
              {/* Header Skeleton */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-4 mb-6">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-10 w-3/4 mb-2" />
                <Skeleton className="h-10 w-1/2" />
              </div>

              {/* Tags Skeleton */}
              <div className="flex gap-2 mb-10">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-14 rounded-md" />
              </div>

              {/* Summary Skeleton */}
              <Skeleton className="h-32 w-full rounded-2xl mb-12" />

              {/* Image Skeleton */}
              <Skeleton className="aspect-video w-full rounded-2xl mb-12" />

              {/* Content Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="py-4">
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </main>

          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-[350px] flex-shrink-0 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex flex-col items-center">
                <Skeleton className="h-20 w-20 rounded-full mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-20 w-full rounded-lg mb-6" />
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
