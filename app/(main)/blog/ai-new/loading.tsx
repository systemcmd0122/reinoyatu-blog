"use client"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 space-y-8 bg-background">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
        <LoadingSpinner size="xl" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
      </div>

      <div className="text-center space-y-3 relative">
        <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic">
          Initializing AI Partner
        </h2>
        <p className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase opacity-60">
          Loading the creative engine
        </p>

        {/* Decorative elements */}
        <div className="flex gap-2 justify-center mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
