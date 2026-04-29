import { BlogListSkeleton } from "@/components/blog/BlogListSkeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, List, PenSquare } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* メインコンテンツ - スケルトン */}
          <main className="flex-1 min-w-0">
            {/* タブナビゲーションのスケルトン */}
            <div className="flex items-center gap-1 mb-6 border-b border-border/50">
              <div className="border-b-2 border-primary px-4 h-10 flex items-center">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="px-4 h-10 flex items-center">
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            {/* ブログ一覧のスケルトン */}
            <BlogListSkeleton count={6} />
          </main>

          {/* 右サイドバーのスケルトン */}
          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
            <div className="hidden lg:block">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* 人気の記事スケルトン */}
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>

            {/* トレンドタグスケルトン */}
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
