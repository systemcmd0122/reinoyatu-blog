import { Metadata } from "next"
import { changelogData } from "@/lib/changelog-data"
import { ChangelogItem } from "@/components/changelog/ChangelogItem"
import { Rocket, Info } from "lucide-react"

export const metadata: Metadata = {
  title: "アップデートログ",
  description: "例のヤツ｜ブログの最新機能の追加、改善、不具合修正などの更新履歴をご確認いただけます。",
}

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">
          アップデートログ
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          「例のヤツ」は日々進化しています。新機能の追加や改善、修正内容を時系列でご確認いただけます。
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-border/50">
          <Info className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-foreground">
            最新のアップデートは <span className="text-primary font-bold">v{changelogData[0].version}</span> です
          </p>
        </div>

        <div className="space-y-2">
          {changelogData.map((entry, index) => (
            <ChangelogItem
              key={entry.version}
              entry={entry}
              isLatest={index === 0}
            />
          ))}
        </div>
      </div>

      <div className="mt-16 p-8 bg-muted/50 rounded-3xl border border-dashed border-border text-center">
        <h2 className="text-xl font-bold mb-3">フィードバックをお待ちしています</h2>
        <p className="text-muted-foreground mb-6">
          「こんな機能が欲しい」「ここを改善してほしい」といったご要望があれば、お気軽にお知らせください。
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="https://twitter.com/reinoyatu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary hover:underline"
          >
            X (Twitter) で送る
          </a>
          <span className="text-border">|</span>
          <a
            href="mailto:contact@example.com"
            className="text-sm font-bold text-primary hover:underline"
          >
            メールで送る
          </a>
        </div>
      </div>
    </div>
  )
}
