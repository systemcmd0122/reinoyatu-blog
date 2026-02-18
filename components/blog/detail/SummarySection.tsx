import React from "react"
import { Wand2 } from "lucide-react"

interface SummarySectionProps {
  summary: string | null
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary }) => {
  if (!summary) return null

  return (
    <section className="mb-12 p-8 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
      <div className="flex items-center gap-2.5 mb-4 text-primary">
        <Wand2 className="h-5 w-5" />
        <span className="font-black text-sm uppercase tracking-wider">AIによる要約</span>
      </div>
      <p className="text-foreground/90 leading-relaxed text-base">
        {summary}
      </p>
    </section>
  )
}

export default SummarySection
