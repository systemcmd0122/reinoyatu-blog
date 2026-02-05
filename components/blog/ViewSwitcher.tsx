"use client"

import React from "react"
import { LayoutGrid, List, Rows, Newspaper, Type } from "lucide-react"
import { ViewMode } from "@/hooks/use-view-mode"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ViewSwitcherProps {
  currentMode: ViewMode
  onModeChange: (mode: ViewMode) => void
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentMode,
  onModeChange,
}) => {
  const modes = [
    { value: "card", icon: LayoutGrid, label: "Gallery" },
    { value: "list", icon: List, label: "Feed" },
    { value: "compact", icon: Rows, label: "Compact" },
    { value: "magazine", icon: Newspaper, label: "Magazine" },
    { value: "text", icon: Type, label: "Text Only" },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <Tabs
        value={currentMode}
        onValueChange={(value) => onModeChange(value as ViewMode)}
        className="w-auto"
      >
        <TabsList className="flex items-center h-10 p-1 bg-muted/50 rounded-xl border border-border/10">
          {modes.map((mode) => (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value={mode.value}
                  className="h-8 w-8 sm:w-10 p-0 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                  <mode.icon className="h-4 w-4" />
                  <span className="sr-only">{mode.label}</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-border/50">
                {mode.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
      </Tabs>
    </TooltipProvider>
  )
}

export default ViewSwitcher
