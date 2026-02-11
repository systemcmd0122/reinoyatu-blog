"use client"

import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface LoadingStateProps {
  message: string
  description?: string
}

export function LoadingState({ message, description }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-[var(--z-overlay)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-6 max-w-xs text-center p-8"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative bg-background rounded-full p-4 border-2 border-primary/20 shadow-xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight text-foreground uppercase">
            {message}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              {description}
            </p>
          )}
        </div>

        <div className="flex gap-1.5">
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
      </motion.div>
    </div>
  )
}