import { ChangelogEntry } from "@/types/changelog"

export const changelogData: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2024-03-20",
    items: [
      {
        category: "New",
        content: "アップデートログ（Changelog）ページを追加しました",
        description: "開発の透明性を高め、最新の機能をいち早くお届けするために専用ページを作成しました。",
      },
      {
        category: "Improvement",
        content: "ランディングページのデザインを大幅に刷新",
        description: "サービスの魅力がより伝わるよう、ヒーローセクションや機能紹介を強化しました。",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2024-03-15",
    items: [
      {
        category: "New",
        content: "リアルタイムコメント機能を導入",
        description: "Supabase Realtimeを活用し、ページをリロードすることなくコメントが表示されるようになりました。",
      },
      {
        category: "Improvement",
        content: "エディタのUX改善",
        description: "マークダウンのプレビュー速度を向上させ、より快適に執筆できるようになりました。",
      },
    ],
  },
  {
    version: "1.0.5",
    date: "2024-03-10",
    items: [
      {
        category: "Fix",
        content: "ダークモード時のコントラスト調整",
        description: "一部のテキストが読みづらかった問題を修正し、視認性を向上させました。",
      },
      {
        category: "Fix",
        content: "モバイル表示でのナビゲーションの不具合を修正",
      },
    ],
  },
]
