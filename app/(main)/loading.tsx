import { Skeleton } from "@/components/ui/skeleton"
import { Search, TrendingUp, ChevronDown } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Skeleton */}
          <main className="flex-1 min-w-0">
            {/* Tab Navigation Skeleton */}
            <div className="bg-card border border-border rounded-t-lg flex items-center px-1 h-12 mb-4">
              <div className="h-full border-b-2 border-primary px-6 flex items-center">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="h-full border-b-2 border-transparent px-6 flex items-center">
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            {/* Blog List Control Panel Skeleton */}
            <div className="bg-card border border-border/50 p-2 rounded-[1.5rem] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 mb-8">
              <div className="flex items-center gap-1 w-full sm:w-auto px-2 py-1">
                <div className="h-2 w-2 rounded-full bg-primary/20 mr-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>

            {/* Blog List Items Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
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
          </main>

          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
            {/* New Post Button Skeleton */}
            <div className="hidden lg:block">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>

            {/* Trending Tags Skeleton */}
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary/30" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="p-2 space-y-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-6 rounded-full" />
                  </div>
                ))}
                <div className="flex justify-center p-3">
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>

            {/* Links Skeleton */}
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <Skeleton className="h-3 w-16 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
