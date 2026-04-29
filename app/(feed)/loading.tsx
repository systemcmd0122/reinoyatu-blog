"use client"

import { motion } from "framer-motion"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

/**
 * ホーム（フィード・ランディングページ）用のローディング
 * ログイン状態に関わらず違和感のない、ブランドカラーを基調とした洗練されたデザイン
 */
export default function Loading() {
  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center space-y-8">
        {/* メインのローディングアニメーション */}
        <div className="relative">
          <LoadingSpinner size="xl" />

          {/* 装飾的な浮遊粒子 */}
          {[0, 120, 240].map((deg, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 bg-primary/40 rounded-full"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos(deg * Math.PI / 180) * 60, 0],
                y: [0, Math.sin(deg * Math.PI / 180) * 60, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* ブランドロゴ */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-2xl font-black text-2xl leading-none shadow-xl shadow-primary/20"
          >
            RY
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5"
          >
            {["L", "o", "a", "d", "i", "n", "g"].map((char, i) => (
              <motion.span
                key={i}
                className="text-xs font-bold tracking-[0.2em] text-muted-foreground/60 uppercase"
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 背景の装飾 */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  )
}
