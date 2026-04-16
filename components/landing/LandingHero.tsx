"use client"

import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles, MousePointer2, Zap, Share2 } from "lucide-react"

export const LandingHero = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "circOut"
      }
    }
  }

  return (
    <section className="relative pt-32 pb-24 lg:pt-56 lg:pb-40 overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center space-y-10"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-black mb-8 animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span className="uppercase tracking-widest">Next Generation Platform</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-foreground leading-[1.05] md:leading-[0.95]">
              あなたの知見を、<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">最高の体験</span>で。
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-3xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium tracking-tight"
          >
            爆速なパフォーマンス、洗練されたエディタ、そしてリアルタイムな反応。<br className="hidden md:block" />
            「書く」という行為を、特別な時間へ変える。
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
          >
            <Link href="/signup">
              <Button size="lg" className="h-16 px-10 rounded-2xl text-xl font-black gap-2 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground group">
                今すぐ書き始める
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-xl font-black bg-background hover:bg-muted active:scale-95 transition-all border-2">
                ログイン
              </Button>
            </Link>
          </motion.div>

          {/* Quick Stats/Features Badges */}
          <motion.div
            variants={itemVariants}
            className="pt-16 flex flex-wrap justify-center gap-8 opacity-50"
          >
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              <Zap className="h-4 w-4" />
              <span>Edge Performance</span>
            </div>
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              <MousePointer2 className="h-4 w-4" />
              <span>Intuitive UI</span>
            </div>
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
              <Share2 className="h-4 w-4" />
              <span>Real-time Connect</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="pt-8 flex justify-center gap-4"
          >
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
