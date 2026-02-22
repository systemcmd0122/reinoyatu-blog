import { Skeleton } from "@/components/ui/skeleton"
import { Play, Layers } from "lucide-react"

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Sidebar Skeleton */}
        <div className="lg:col-span-4">
          <div className="space-y-8 bg-card/50 p-8 rounded-[3rem] border border-border/50 shadow-sm">
            <Skeleton className="h-3 w-32" />

            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-muted flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/20" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-2/3" />
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="flex flex-col gap-3 pt-8">
                <Skeleton className="h-14 w-full rounded-[1.25rem]" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Skeleton */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex items-center justify-between border-b border-border/50 pb-6">
             <div className="flex items-center gap-3">
               <Layers className="h-6 w-6 text-muted-foreground/20" />
               <Skeleton className="h-8 w-48" />
             </div>
           </div>

           <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex gap-6 p-6 rounded-[2rem] bg-card border border-border">
                 <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                 <div className="flex-1 space-y-2 py-2">
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-4 w-32" />
                 </div>
                 <Skeleton className="w-8 h-8 rounded-full self-center" />
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}
