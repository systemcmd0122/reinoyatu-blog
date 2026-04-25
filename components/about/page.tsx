// components/about/page.tsx
"use client"

import { motion } from "framer-motion"
import { Sparkles, Zap, Users, Heart, Target, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const About = () => {
    const values = [
        {
            icon: Sparkles,
            title: "独自性",
            description: "あなたの知見と経験を、そのまま世界へ発信できるプラットフォーム。既存の枠にとらわれない、自由な表現を支援します。",
            color: "text-primary"
        },
        {
            icon: Zap,
            title: "パフォーマンス",
            description: "爆速な読み込み、リアルタイム通知、シームレスな操作感。技術的卓越性により、最高のユーザー体験を実現しています。",
            color: "text-amber-500"
        },
        {
            icon: Users,
            title: "コミュニティ",
            description: "単なる配信ではなく、読者とのリアルタイムな対話を重視。コメント、リアクション、シェアを通じた双方向コミュニケーション。",
            color: "text-blue-500"
        },
        {
            icon: Heart,
            title: "ユーザーファースト",
            description: "ユーザーのニーズを最優先に。継続的な改善、使いやすいUIデザイン、そして透明性のあるサービス運営を実践します。",
            color: "text-rose-500"
        },
        {
            icon: Target,
            title: "品質保証",
            description: "AdSenseプログラムに準拠した、高品質なコンテンツのみを掲載。ポリシー遵守を徹底し、安全で信頼できる環境を提供。",
            color: "text-green-500"
        },
        {
            icon: BookOpen,
            title: "継続的成長",
            description: "ブロガーの成長を支援します。アナリティクス、SEO最適化、マネタイズ機能など、成功に必要なツールを完備。",
            color: "text-indigo-500"
        }
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダーセクション */}
            <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-6">
                            例のヤツ｜ブログについて
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                            単なる情報の消費ではなく、知識の「共創」を。
                            プログラミング、ガジェット、ライフハックなど、各分野の専門家や熱狂的なファンが集まり、
                            価値ある体験を分かち合う次世代型ブログプラットフォームです。
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ミッション・ビジョンセクション */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/50">
                <div className="max-w-4xl mx-auto space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h2 className="text-3xl font-bold text-foreground">私たちのミッション</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            「書く」という創造行為を、特別な時間へと変える。テクノロジーと人間らしさの融合を通じて、
                            個人の知見や経験が適切に評価される世界を実現することです。
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-3xl font-bold text-foreground">ビジョン</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            個人のクリエイティビティが尊重され、コミュニティとのつながりが価値を生み出す。
                            そうした環境で、すべてのブロガーが自分のポテンシャルを最大限に発揮できるプラットフォームを目指しています。
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* バリュー（価値観）セクション */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-foreground mb-4">私たちの価値観</h2>
                        <p className="text-muted-foreground text-lg">6つのコア・バリューで、サービスを支えています。</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {values.map((value, idx) => {
                            const Icon = value.icon
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
                                >
                                    <div className="flex items-center mb-4">
                                        <div className={`${value.color} mr-4`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">{value.title}</h3>
                                    </div>
                                    <p className="text-muted-foreground">{value.description}</p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* 特徴セクション */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-4xl font-bold text-foreground text-center">主な特徴</h2>

                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-foreground mb-3">高品質なコンテンツプラットフォーム</h3>
                                <p className="text-muted-foreground">
                                    AdSenseプログラムのポリシーに完全準拠した、安全で信頼できるプラットフォームです。
                                    アルゴリズムによる品質管理と、ユーザーによるモデレーションにより、有用で独自性のあるコンテンツのみが掲載されます。
                                </p>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-foreground mb-3">先端技術による高速体験</h3>
                                <p className="text-muted-foreground">
                                    Next.js App Router、Supabase Realtime、PWAなど、最新のウェブ技術を採用。
                                    爆速な読み込み、リアルタイム更新、アプリのような操作感を実現しています。
                                </p>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-foreground mb-3">充実したコンテンツ作成ツール</h3>
                                <p className="text-muted-foreground">
                                    Tiptap v3ベースの多機能エディタ、AIアシスト機能、画像の自動最適化など。
                                    ブロガーが集中できる執筆環境を完備しています。
                                </p>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-8">
                                <h3 className="text-2xl font-bold text-foreground mb-3">活発なコミュニティ機能</h3>
                                <p className="text-muted-foreground">
                                    リアルタイムコメント、リアクション、ブックマーク、シリーズ機能など。
                                    読者とのダイレクトな交流を通じて、ブロガーのモチベーション向上と、
                                    コンテンツの質的向上をサポートしています。
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 運営者情報セクション */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-card border border-border rounded-2xl p-8 md:p-12"
                    >
                        <h2 className="text-3xl font-bold text-foreground mb-8 text-center">運営者情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">運営者 / 代表者</h3>
                                    <p className="text-lg font-bold text-foreground">例のヤツ (ReinoYatu)</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">活動拠点</h3>
                                    <p className="text-lg text-foreground">日本</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">お問い合わせ</h3>
                                    <p className="text-lg text-foreground">
                                        <Link href="/contact" className="text-primary hover:underline">
                                            お問い合わせフォーム
                                        </Link>
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">主な活動内容</h3>
                                    <p className="text-muted-foreground">
                                        共創型ブログプラットフォーム「例のヤツ｜ブログ」の開発・運営。
                                        エンジニアリング、ガジェット、ライフスタイルなど、多岐にわたる分野の情報発信を支援。
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">SNS</h3>
                                    <p className="text-lg text-foreground">
                                        <a href="https://x.com/min_brother2158" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            X (Twitter)
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA セクション */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-foreground mb-4">
                            今すぐ始めましょう
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            あなたの知見と経験を世界へ。例のヤツ｜ブログで、新しい表現の可能性を探りませんか？
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/signup">
                                <Button size="lg" className="rounded-2xl font-bold px-8">
                                    無料で始める
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button size="lg" variant="outline" className="rounded-2xl font-bold px-8">
                                    記事を読む
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default About
