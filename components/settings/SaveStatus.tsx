"use client"

import { CheckCircle2, Loader2, AlertCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SaveStatusProps {
  status: "unsaved" | "saving" | "saved" | "error"
  className?: string
}

const SaveStatus = ({ status, className }: SaveStatusProps) => {
  return (
    <div className={cn("flex items-center shrink-0 text-sm font-medium transition-all duration-300", className)}>
      <AnimatePresence mode="wait">
        {status === "unsaved" && (
          <motion.div
            key="unsaved"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full whitespace-nowrap"
          >
            <Circle className="h-3 w-3 mr-1.5 fill-current shrink-0" />
            <span className="text-xs">未保存</span>
          </motion.div>
        )}
        {status === "saving" && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-sm shadow-primary/5 relative overflow-hidden whitespace-nowrap"
          >
            <motion.div
              className="absolute inset-0 bg-primary/10"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin relative z-10 shrink-0" />
            <span className="tabular-nums relative z-10 text-xs">保存中...</span>
          </motion.div>
        )}
        {status === "saved" && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 whitespace-nowrap"
          >
            <CheckCircle2 className="h-3 w-3 mr-1.5 shrink-0" />
            <span className="text-xs">保存済み</span>
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center text-destructive bg-destructive/10 px-3 py-1.5 rounded-full whitespace-nowrap"
          >
            <AlertCircle className="h-3 w-3 mr-1.5 shrink-0" />
            <span className="text-xs">エラー</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SaveStatus