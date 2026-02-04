export type ChangelogCategory = "New" | "Improvement" | "Fix" | "Breaking"

export interface ChangelogEntry {
  version: string
  date: string
  items: {
    category: ChangelogCategory
    content: string
    description?: string
  }[]
}
