"use client"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { motion } from "framer-motion"
import { PenSquare } from "lucide-react"

export default function Loading() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 space-y-8 bg-background">
      <div className="relative">
        <LoadingSpinner size="xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PenSquare className="h-6 w-6 text-primary/40" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
          Opening Editor
        </h2>
        <div className="flex gap-1 justify-center">
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            className="w-1.5 h-1.5 bg-primary/40 rounded-full"
          />
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="w-1.5 h-1.5 bg-primary/40 rounded-full"
          />
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="w-1.5 h-1.5 bg-primary/40 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
