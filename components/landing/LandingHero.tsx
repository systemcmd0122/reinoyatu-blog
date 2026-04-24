"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles, MousePointer2, Zap, Share2 } from "lucide-react"

export const LandingHero = () => {
  return (
    <section className="relative pt-32 pb-24 lg:pt-56 lg:pb-40 overflow-hidden bg-background">
      {/* Background Decor - Simplified */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="uppercase tracking-widest">Next Generation Platform</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-foreground leading-[1.1] md:leading-[1.1]">
              あなたの知見を、<br />
              <span className="text-primary">最高の体験</span>で。
            </h1>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            爆速なパフォーマンス、洗練されたエディタ、そしてリアルタイムな反応。<br className="hidden md:block" />
            「書く」という行為を、特別な時間へ変える。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 rounded-lg text-lg font-bold gap-2 shadow-sm bg-primary text-primary-foreground group">
                今すぐ書き始める
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-lg text-lg font-bold bg-background hover:bg-muted transition-all">
                ログイン
              </Button>
            </Link>
          </div>

          {/* Quick Stats/Features Badges */}
          <div className="pt-16 flex flex-wrap justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <Zap className="h-4 w-4 text-primary" />
              <span>Edge Performance</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <MousePointer2 className="h-4 w-4 text-primary" />
              <span>Intuitive UI</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <Share2 className="h-4 w-4 text-primary" />
              <span>Real-time Connect</span>
            </div>
          </div>

          <div className="pt-8 flex justify-center gap-4">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              このサイトについて
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              プライバシーポリシー
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
