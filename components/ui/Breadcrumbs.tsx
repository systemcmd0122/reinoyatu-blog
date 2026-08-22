import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="パンくずリスト" className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto py-2">
      <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors flex-shrink-0">
        <Home className="h-3 w-3" />
        <span>ホーム</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors truncate max-w-[200px]">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[200px]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
