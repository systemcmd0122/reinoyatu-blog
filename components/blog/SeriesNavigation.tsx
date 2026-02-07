"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SeriesNavigationProps {
  collection: {
    id: string
    title: string
  }
  prevPost: { id: string; title: string } | null
  nextPost: { id: string; title: string } | null
  currentIndex: number
  totalCount: number
}

export default function SeriesNavigation({
  collection,
  prevPost,
  nextPost,
  currentIndex,
  totalCount
}: SeriesNavigationProps) {
  return (
    <Card className="mt-8 overflow-hidden border-border/50 rounded-[2rem] shadow-sm">
      <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Play className="h-3.5 w-3.5 text-primary" />
          </div>
          <Link
            href={`/collections/${collection.id}`}
            className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            {collection.title} ({currentIndex + 1} / {totalCount})
          </Link>
        </div>
        <Link
          href={`/collections/${collection.id}`}
          className="text-[10px] font-bold text-primary hover:underline"
        >
          全件表示
        </Link>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        {prevPost ? (
          <Link
            href={`/blog/${prevPost.id}?collection=${collection.id}`}
            className="p-6 hover:bg-muted/20 transition-all group text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2 group-hover:text-primary">
              <ChevronLeft className="h-3 w-3" />
              前の記事
            </span>
            <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {prevPost.title}
            </p>
          </Link>
        ) : (
          <div className="p-6 opacity-30 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
              <ChevronLeft className="h-3 w-3" />
              前の記事
            </span>
            <p className="font-bold text-sm">なし</p>
          </div>
        )}

        {nextPost ? (
          <Link
            href={`/blog/${nextPost.id}?collection=${collection.id}`}
            className="p-6 hover:bg-muted/20 transition-all group text-right"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-end gap-1 mb-2 group-hover:text-primary">
              次の記事
              <ChevronRight className="h-3 w-3" />
            </span>
            <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {nextPost.title}
            </p>
          </Link>
        ) : (
          <div className="p-6 opacity-30 text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-end gap-1 mb-2">
              次の記事
              <ChevronRight className="h-3 w-3" />
            </span>
            <p className="font-bold text-sm">なし</p>
          </div>
        )}
      </div>
    </Card>
  )
}
