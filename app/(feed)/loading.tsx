import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        {/* Hero Section Skeleton */}
        <section className="mb-16">
          <div className="max-w-3xl space-y-6 animate-pulse">
            {/* Tagline */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground/30" />
              <Skeleton className="h-3 w-40" />
            </div>

            {/* Main Heading */}
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 w-32 rounded-xl" />
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="mb-16">
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-6 w-32" />

            {/* Featured Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4 bg-card/50 p-6 rounded-2xl border border-border/50">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Articles Section */}
        <section>
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-6 w-40" />

            {/* Article Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card/50 rounded-2xl border border-border/50 overflow-hidden p-4 space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
