import { Skeleton } from "@/components/ui/skeleton"
import { Bookmark } from "lucide-react"
import { BlogListSkeleton } from "@/components/blog/BlogListSkeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-10 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-muted rounded-2xl">
              <Bookmark className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>

        <BlogListSkeleton count={5} />
      </div>
    </div>
  )
}
