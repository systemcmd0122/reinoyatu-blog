"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileHeaderProps {
  title?: string
  showBackButton?: boolean
  rightElement?: React.ReactNode
  className?: string
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = true,
  rightElement,
  className,
}) => {
  const router = useRouter()

  return (
    <header
      className={cn(
        "md:hidden sticky top-0 z-[var(--z-nav)] flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 h-9 w-9 rounded-full"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        {title && (
          <h1 className="truncate text-base font-bold tracking-tight">
            {title}
          </h1>
        )}
      </div>
      {rightElement && <div className="flex items-center">{rightElement}</div>}
    </header>
  )
}
