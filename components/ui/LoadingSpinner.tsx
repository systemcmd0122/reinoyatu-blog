"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export const LoadingSpinner = ({ className, size = "md" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "rounded-full border-2 border-primary/10",
          sizeClasses[size]
        )}
      />
      <motion.div
        className={cn(
          "absolute rounded-full border-t-2 border-primary",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className={cn("text-primary animate-pulse", size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4")} />
      </div>
    </div>
  )
}
