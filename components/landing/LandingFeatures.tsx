"use client"

import { 
  PenLine, 
  MessageSquare, 
  Heart, 
  Zap, 
  CheckCircle2, 
  Layout,
  Smartphone,
  Users
} from "lucide-react"
import { motion } from "framer-motion"

export const LandingFeatures = () => {
  const features = [
    {
      title: "リアルタイムな対話",
      description: "Supabase Realtimeを活用。リロード不要でコメントやリアクションが即座に反映されます。",
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "直感的なエディタ",
      description: "Tiptap v3ベースの多機能エディタ。スラッシュコマンドやAIアシストで執筆を加速。",
      icon: PenLine,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "高度なメディア管理",
      description: "画像の自動最適化とクリーンアップ。ドラッグ＆ドロップでシームレスな挿入が可能。",
      icon: Layout,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "爆速な表示速度",
      description: "Next.js App RouterとEdge Networkの組み合わせにより、極限の閲覧体験を提供。",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "アプリのような体験",
      description: "PWAに完全対応。モバイル端末でもネイティブアプリのような操作感を実現。",
      icon: Smartphone,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "共同編集・シリーズ",
      description: "複数人での執筆や連載記事の作成。YouTubeスタイルのナビゲーションで回遊性を向上。",
      icon: Users,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ]

  return (
    <>
      {/* Features Grid */}
      <section className="py-32 md:py-48 bg-muted/20 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground"
            >
              「書く」も「読む」も、<br className="sm:hidden" />心地よい体験を。
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg font-medium"
            >
              従来のブログの枠を超えた、双方向のコミュニケーションと最新技術の融合。
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
                className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:border-primary/30 transition-all duration-300 group relative overflow-hidden"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-all duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Target Audience */}
      <section className="py-32 md:py-48 border-y border-border bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold text-foreground leading-tight"
              >
                あなたの声が、<br />誰かの「きっかけ」になる。
              </motion.h2>
              <div className="space-y-4">
                {[
                  "開発知見を共有したいエンジニア",
                  "日常の気づきを綴りたいクリエイター",
                  "最新情報を追いかける感度の高い読者"
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border border-border hover:bg-muted transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-lg font-bold text-foreground/80">{text}</span>
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="text-muted-foreground text-lg leading-relaxed font-medium border-l-2 border-primary/20 pl-6"
              >
                オープンでフラットなコミュニケーション。
                多様なトピックが集まる、心地よい空間を目指しています。
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 grid grid-cols-2 gap-4 w-full"
            >
              <div className="space-y-4 pt-8">
                <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 aspect-square flex flex-col justify-center text-center shadow-sm">
                  <div className="text-5xl font-bold text-primary mb-2">3s</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Posting</div>
                </div>
                <div className="bg-muted p-8 rounded-2xl border border-border aspect-[4/3] flex flex-col justify-center text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">Markdown</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Standard Support</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-card p-8 rounded-2xl border border-border aspect-[4/3] flex flex-col justify-center text-center shadow-sm">
                  <div className="text-2xl font-bold text-foreground mb-1">PWA</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">App Experience</div>
                </div>
                <div className="bg-primary p-8 rounded-2xl flex flex-col justify-center text-center shadow-sm">
                  <div className="text-5xl font-bold text-primary-foreground mb-2">Real</div>
                  <div className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest">Time Sync</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
