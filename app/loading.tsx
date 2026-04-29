"use client"

import { motion } from "framer-motion"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

/**
 * サイト全体のルートローディング画面
 * 没入感のある、シンプルかつプレミアムな体験を提供
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[var(--z-overlay)] overflow-hidden">
      {/* 背景の装飾: 柔らかなグラデーション光 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

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

        {/* ブランドロゴまたはテキスト */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-black text-xl leading-none shadow-lg shadow-primary/20"
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
                className="text-xs font-bold tracking-widest text-muted-foreground/80 uppercase"
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

        {/* インジケーターバー */}
        <div className="w-32 h-0.5 bg-muted rounded-full overflow-hidden relative">
          <motion.div
            className="absolute inset-0 bg-primary/40"
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </div>

      {/* ドットパターンの背景装飾 */}
      <div className="absolute inset-0 -z-10 opacity-[0.15] dark:opacity-[0.1] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    </div>
  )
}
