import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-pulse">
      {/* Header / Hero Section Skeleton */}
      <section className="relative">
        <div className="h-48 md:h-64 w-full bg-muted rounded-3xl" />
        <div className="px-6 md:px-12 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <Skeleton className="h-40 w-40 rounded-[2.5rem] border-8 border-background bg-background" />
              <div className="text-center md:text-left space-y-4 pb-2">
                <Skeleton className="h-10 w-48 mx-auto md:mx-0" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            <div className="pb-2">
              <Skeleton className="h-12 w-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
        {/* Left Sidebar Skeleton */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 lg:grid-cols-2 divide-x divide-y divide-border">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 text-center">
                    <Skeleton className="h-8 w-8 rounded-xl mx-auto mb-2" />
                    <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-border/50 shadow-sm">
            <CardContent className="p-8 space-y-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Skeleton */}
        <div className="lg:col-span-8">
          <div className="mb-6 bg-background/50 p-1.5 rounded-2xl border border-border/50 flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden divide-y divide-border/50 shadow-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 flex gap-6">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-28 w-48 rounded-2xl hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
