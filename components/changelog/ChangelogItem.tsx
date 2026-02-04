import { ChangelogEntry } from "@/types/changelog"
import { ChangelogBadge } from "./ChangelogBadge"
import { CalendarDays, Tag } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface ChangelogItemProps {
  entry: ChangelogEntry
  isLatest?: boolean
}

export const ChangelogItem = ({ entry, isLatest }: ChangelogItemProps) => {
  return (
    <div className="relative pl-8 pb-12 last:pb-0 group">
      {/* Timeline connector */}
      <div className="absolute left-[11px] top-[24px] bottom-0 w-[2px] bg-border group-last:hidden" />

      {/* Timeline dot */}
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 bg-background z-10 transition-colors ${
        isLatest ? "border-primary" : "border-muted-foreground/30"
      }`} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <time className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(entry.date), "yyyy年MM月dd日", { locale: ja })}
          </time>
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
            isLatest
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            v{entry.version}
          </span>
          {isLatest && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </div>

        <div className="space-y-6">
          {entry.items.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <ChangelogBadge category={item.category} className="mt-0.5" />
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {item.content}
                </h3>
              </div>
              {item.description && (
                <p className="text-muted-foreground text-sm leading-relaxed pl-[92px]">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
