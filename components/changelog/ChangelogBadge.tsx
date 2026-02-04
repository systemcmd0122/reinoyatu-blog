import { Badge } from "@/components/ui/badge"
import { ChangelogCategory } from "@/types/changelog"
import { cn } from "@/lib/utils"

interface ChangelogBadgeProps {
  category: ChangelogCategory
  className?: string
}

export const ChangelogBadge = ({ category, className }: ChangelogBadgeProps) => {
  const variants: Record<ChangelogCategory, string> = {
    New: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    Improvement: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20",
    Fix: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
    Breaking: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
    Design: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
    Performance: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20",
    Security: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
    Other: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20",
  }

  const labels: Record<ChangelogCategory, string> = {
    New: "New",
    Improvement: "Improvement",
    Fix: "Fix",
    Breaking: "Breaking",
    Design: "Design",
    Performance: "Performance",
    Security: "Security",
    Other: "Other",
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-semibold rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider", variants[category], className)}
    >
      {labels[category]}
    </Badge>
  )
}
