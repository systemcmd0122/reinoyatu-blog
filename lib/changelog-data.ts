import { ChangelogEntry } from "@/types/changelog"

export const changelogData: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "2026-02-11",
    items: [
      {
        category: "Improvement",
        content: "UI/UX フィードバック・ローディングの大幅刷新",
        description: "「今何が起きているか」を直感的に理解できるよう、すべての非同期処理に詳細な状態表示（保存中、公開中、反映中など）と、洗練されたスケルトン画面を導入しました。",
      },
      {
        category: "Improvement",
        content: "ボタンコンポーネントの強化",
        description: "非同期処理中にボタン内でスピナーと意味のある文言を表示し、二重送信やユーザーの不安を完全に解消する設計に刷新しました。",
      },
      {
        category: "Improvement",
        content: "ダークモードに対応した「ブログに特化した」ローディング画面",
        description: "画像を使用せず、CSS/SVGのみで構築された軽量かつ洗練されたローディング画面に移行。タイポグラフィに基づいたアニメーションで待機時間を心地よい体験に変えます。",
      },
      {
        category: "Performance",
        content: "スケルトンローディングの導入",
        description: "記事一覧やプロフィール画面のデータ取得中に、実際のコンテンツに近い形のスケルトンを表示。体感速度を大幅に向上させました。",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2025-09-18",
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
      {
        category: "Design",
        content: "ナビゲーションバーのデザインを刷新",
        description: "より直感的で使いやすいUIを実装し、ユーザーアイコンの表示を追加しました。パーソナライズされた体験とスムーズなナビゲーションを実現しています。",
      },
      {
        category: "Performance",
        content: "Markdownコードブロックにコピーボタンを追加",
        description: "コードをクリップボードへ簡単にコピーできるようになり、開発効率が大幅に向上しました。",
      },
      {
        category: "Improvement",
        content: "ブログ記事の表示量を最適化",
        description: "1ページあたり9件までの表示に制限し、ページネーションを導入。ロード時間の短縮とユーザーエクスペリエンスの向上を実現しました。",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2025-09-17",
    items: [
      {
        category: "New",
        content: "ユーザープロフィール機能を追加",
        description: "個別のプロフィール画面を実装し、投稿一覧、自己紹介、ソーシャルリンクを表示できるようになりました。ユーザー間の繋がりがより深まります。",
      },
      {
        category: "Performance",
        content: "処理速度を大幅に改善",
        description: "「いいね！」とブックマーク処理を高速化し、ウェブサイト全体の画像表示も最適化。より快適な閲覧体験を提供します。",
      },
      {
        category: "Fix",
        content: "Googleログインの不具合を修正",
        description: "Googleアカウントでログインした際に404ページにリダイレクトされるバグを修正し、正常にログインできるようになりました。",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-03-02",
    items: [
      {
        category: "Design",
        content: "モバイル版ナビゲーションを改善",
        description: "ナビゲーションボードにホームへのリンクを追加し、ボタンアイコンをモバイル版・PC版ともに修正しました。",
      },
      {
        category: "New",
        content: "Markdownにコードブロック機能を追加",
        description: "プログラムコードを美しく表示できるコードブロック機能を実装。開発者にとってより便利なブログ投稿が可能になりました。",
      },
      {
        category: "New",
        content: "YouTube動画埋め込み機能を追加",
        description: "記事内で直接YouTube動画を表示できるようになりました。YouTube ID Extractorツールも提供し、動画IDの取得も簡単です。",
      },
      {
        category: "Security",
        content: "Google認証のセキュリティを強化",
        description: "Google認証のバグを修正し、アカウント登録時のセキュリティを強化しました。",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2025-02-26",
    items: [
      {
        category: "New",
        content: "ブログ投稿サイト「例のヤツ」を正式リリース",
        description: "誰でも自由にブログを投稿できるサイトがオープンしました。ユーザー登録するだけで、記事の投稿・編集・削除が可能です。",
      },
      {
        category: "New",
        content: "ブックマーク機能と「いいね」機能を実装",
        description: "投稿者と読者の交流を促進する機能を追加。お気に入りの記事を保存したり、いいねで応援できます。",
      },
      {
        category: "New",
        content: "初心者向けの使いやすい設計",
        description: "自分の考えや日常を気軽に発信できる、シンプルで分かりやすいインターフェースを実現しました。今後はコメント機能も実装予定です。",
      },
    ],
  },
]