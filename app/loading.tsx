"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

/**
 * ブログサイトに特化した、タイポグラフィ重視の洗練されたローディング画面
 * 画像を使用せずCSS/SVGのみで構成し、ダークモードにも完全対応
 */
const Loading = () => {
  const words = ["Drafting...", "Polishing...", "Formatting...", "Publishing...", "Loading Content..."]
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[var(--z-overlay)]">
      <div className="relative flex flex-col items-center">
        {/* ミニマルなプログレスリング */}
        <div className="relative mb-8">
          <motion.div
            className="w-20 h-20 rounded-full border-2 border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.div
            className="absolute top-0 left-0 w-20 h-20 rounded-full border-t-2 border-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>

        {/* テキストアニメーション: 執筆プロセスの言葉が入れ替わる */}
        <div className="h-10 flex flex-col items-center overflow-hidden">
          <motion.div
            animate={{
              y: [0, -40, -80, -120, -160],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
            className="flex flex-col items-center gap-6"
          >
            {words.map((word, i) => (
              <span
                key={i}
                className="text-2xl font-black tracking-tighter uppercase italic text-foreground"
              >
                {word}
              </span>
            ))}
          </motion.div>
        </div>

        {/* サブテキスト */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60"
        >
          Gathering your insights
        </motion.p>
      </div>

      {/* 背景の装飾的な要素 (SVGグリッド) */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )
}

export default Loading
