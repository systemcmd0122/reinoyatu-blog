"use client"

import React from "react"
import { LayoutGrid, List, Rows, Settings2 } from "lucide-react"
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
  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-1.5 mr-1 text-muted-foreground">
        <Settings2 className="h-4 w-4" />
        <span className="text-xs font-medium">表示設定</span>
      </div>
      
      <TooltipProvider delayDuration={300}>
        <Tabs
          value={currentMode}
          onValueChange={(value) => onModeChange(value as ViewMode)}
          className="w-auto"
        >
          <TabsList className="grid grid-cols-3 w-[120px] sm:w-[150px] h-9 p-1 bg-muted/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="card" className="h-7 px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">カード表示</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="list" className="h-7 px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">リスト表示</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="compact" className="h-7 px-0 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Rows className="h-4 w-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">コンパクト表示</TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>
      </TooltipProvider>
    </div>
  )
}

export default ViewSwitcher
