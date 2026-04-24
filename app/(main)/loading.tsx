"use client"

import { motion } from "framer-motion"
import { BookOpen, Pencil } from "lucide-react"

/**
 * ブログサイトらしい、可愛くて洗練されたローディングアニメーション
 */
export default function Loading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        {/* ブログアイコンのアニメーション */}
        <div className="relative mb-12 h-20 w-20">
          {/* 本のアイコン */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              y: [0, -10, 0],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-sm">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          </motion.div>

          {/* ペンのアイコン - 書いているような動き */}
          <motion.div
            className="absolute -bottom-2 -right-2 p-2 rounded-full bg-background border-2 border-primary/20 shadow-md"
            animate={{
              x: [0, 5, 0, -5, 0],
              y: [0, -5, 5, 0],
              rotate: [0, 15, -15, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Pencil className="h-5 w-5 text-primary" />
          </motion.div>

          {/* 周りのキラキラ */}
          {[0, 72, 144, 216, 288].map((degree, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-primary/40"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                scale: [0, 1, 0],
                x: [0, Math.cos(degree * Math.PI / 180) * 40],
                y: [0, Math.sin(degree * Math.PI / 180) * 40],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* テキストセクション */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-1">
            {["L", "o", "a", "d", "i", "n", "g"].map((char, i) => (
              <motion.span
                key={i}
                className="text-2xl font-black tracking-tight text-primary"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              >
                {char}
              </motion.span>
            ))}
            <motion.span
              className="flex gap-1 ml-1"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </motion.span>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-1"
          >
            Fetching stories
          </motion.p>
        </div>

        {/* 下のプログレスバーのようなもの */}
        <div className="mt-10 w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/40"
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  )
}
