export type ChangelogCategory = "New" | "Improvement" | "Fix" | "Breaking" | "Design" | "Performance" | "Security" | "Other"


export interface ChangelogEntry {
  version: string
  date: string
  items: {
    category: ChangelogCategory
    content: string
    description?: string
  }[]
}
