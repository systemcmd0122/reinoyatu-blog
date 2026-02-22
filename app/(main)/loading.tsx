"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

/**
 * (main) レイアウト内の各ページで共通して使用される、シンプルで洗練されたフォールバックローディング
 */
export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-3xl animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center">
        {/* ミニマルなプログレスリング */}
        <div className="relative mb-6">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.div
            className="absolute top-0 left-0 w-12 h-12 rounded-full border-t-2 border-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-primary animate-pulse" />
          </div>
        </div>

        {/* テキスト */}
        <div className="space-y-1 text-center">
          <p className="text-sm font-black tracking-widest uppercase italic text-foreground">
            Loading
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60"
          >
            Please wait a moment
          </motion.p>
        </div>
      </div>
    </div>
  )
}
