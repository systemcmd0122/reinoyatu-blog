"use client"

import {
  PenLine,
  MessageSquare,
  Heart,
  Zap,
  CheckCircle2,
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
      title: "快適な執筆体験",
      description: "Markdown記法に対応。書くことに集中できるシンプルで洗練されたエディタを搭載。",
      icon: PenLine,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "直感的なリアクション",
      description: "「いいね」だけじゃない。多彩な絵文字で、記事への気持ちをダイレクトに伝えられます。",
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "爆速な表示速度",
      description: "Next.js App Routerによる最適化。ストレスのない閲覧体験を提供します。",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <>
      {/* Features Grid */}
      <section className="py-24 bg-muted/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6">
              「書く」も「読む」も、<br className="sm:hidden" />もっと楽しく。
            </h2>
            <p className="text-muted-foreground text-lg">
              従来のブログの枠を超えた、双方向のコミュニケーションを重視した設計。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border border-border p-8 rounded-3xl hover:shadow-xl hover:shadow-primary/5 transition-all group"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Target Audience */}
      <section className="py-24 border-y border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                あなたの声が、<br />誰かの「きっかけ」になる。
              </h2>
              <div className="space-y-4">
                {[
                  "開発知見を共有したいエンジニア",
                  "日常の気づきを綴りたいクリエイター",
                  "最新情報を追いかける感度の高い読者"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <span className="text-lg font-medium text-foreground/80">{text}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-lg">
                オープンでフラットなコミュニケーション。
                多様なトピックが集まる、心地よい空間を目指しています。
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="space-y-4">
                <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 aspect-square flex flex-col justify-center text-center">
                  <div className="text-4xl font-black text-primary mb-2">3s</div>
                  <div className="text-sm font-bold text-muted-foreground">Quick Posting</div>
                </div>
                <div className="bg-muted p-8 rounded-3xl border border-border aspect-[4/3] flex flex-col justify-center text-center">
                  <div className="text-2xl font-black text-foreground mb-1">Markdown</div>
                  <div className="text-sm text-muted-foreground">Standard Support</div>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-muted p-8 rounded-3xl border border-border aspect-[4/3] flex flex-col justify-center text-center">
                  <div className="text-2xl font-black text-foreground mb-1">PWA</div>
                  <div className="text-sm text-muted-foreground">App Experience</div>
                </div>
                <div className="bg-blue-500/5 p-8 rounded-3xl border border-blue-500/10 aspect-square flex flex-col justify-center text-center">
                  <div className="text-4xl font-black text-blue-500 mb-2">Real</div>
                  <div className="text-sm font-bold text-muted-foreground">Time Updates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
