"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, MessageSquare, Heart } from "lucide-react"
import { motion } from "framer-motion"

export const LandingHero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <section className="relative pt-20 pb-32 md:pt-32 md:pb-48">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>次世代のブログプラットフォーム</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-8 leading-[1.1]">
            想いを言葉に、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              価値をリアルタイムに。
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            「例のヤツ」は、モダンな技術スタックで構築されたブログプラットフォームです。
            あなたの知見や物語を、もっとも美しく、もっとも速く共有しましょう。
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground">
                無料で始める <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-lg font-bold transition-all hover:bg-muted active:scale-95">
                ログイン
              </Button>
            </Link>
          </motion.div>

          {/* Mockup Preview */}
          <motion.div
            variants={itemVariants}
            className="mt-20 relative mx-auto max-w-5xl px-4"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl">
              <div className="bg-muted/50 border-b border-border p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="mx-auto bg-background/50 rounded-md px-4 py-1 text-[10px] text-muted-foreground border border-border">
                  reinoyatu-blog.vercel.app
                </div>
              </div>
              <div className="aspect-[16/9] bg-card p-4 md:p-8">
                <div className="flex flex-col gap-6 animate-pulse text-left">
                  <div className="h-10 w-3/4 bg-muted rounded-lg" />
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="h-32 bg-muted rounded-xl" />
                    <div className="h-32 bg-muted rounded-xl" />
                    <div className="h-32 bg-muted rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-6 -right-6 md:top-10 md:-right-10 bg-background border border-border p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce hidden sm:flex">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground leading-none mb-1">Reaction</div>
                <div className="text-sm font-black">+42 Likes!</div>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-6 md:bottom-20 md:-left-12 bg-background border border-border p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse hidden sm:flex">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-muted-foreground leading-none mb-1">Realtime</div>
                <div className="text-sm font-black">New Comment!</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
