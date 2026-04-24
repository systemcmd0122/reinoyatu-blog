import React from "react"
import { BookOpen } from "lucide-react"

interface SummarySectionProps {
  summary: string | null
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary }) => {
  if (!summary) return null

  return (
    <section className="mb-12 p-8 rounded-lg bg-muted/30 border border-border relative overflow-hidden">
      <div className="flex items-center gap-2.5 mb-4 text-foreground/70">
        <BookOpen className="h-4 w-4" />
        <span className="font-bold text-sm uppercase tracking-wider">この記事の要約</span>
      </div>
      <p className="text-foreground/90 leading-relaxed text-base">
        {summary}
      </p>
    </section>
  )
}

export default SummarySection
