"use client"

import { motion } from "framer-motion"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { cn } from "@/lib/utils"

interface BrandLoaderProps {
  fullPage?: boolean
  text?: string
  subtext?: string
  className?: string
}

/**
 * サイト全体の統一ブランドローディング画面
 * シンプルで使いやすく、ブランドのアイデンティティ（RY）を強調
 */
export const BrandLoader = ({
  fullPage = false,
  text = "Loading",
  subtext,
  className
}: BrandLoaderProps) => {
  const containerClasses = cn(
    "flex flex-col items-center justify-center bg-background overflow-hidden",
    fullPage ? "fixed inset-0 z-[var(--z-overlay)]" : "w-full min-h-[70vh] relative",
    className
  )

  return (
    <div className={containerClasses}>
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

        {/* ブランドロゴとテキスト */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-2xl font-black text-2xl leading-none shadow-xl shadow-primary/20"
          >
            RY
          </motion.div>

          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5"
            >
              {text.split("").map((char, i) => (
                <motion.span
                  key={i}
                  className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase"
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

            {subtext && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground"
              >
                {subtext}
              </motion.p>
            )}
          </div>
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
      <div className="absolute inset-0 -z-10 opacity-[0.1] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  )
}
