import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="space-y-6 pt-6 border-t border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>

      <div className="pt-8 flex justify-end">
        <Skeleton className="h-12 w-32 rounded-xl" />
      </div>
    </div>
  )
}
