"use client"

import { useTheme } from "next-themes"
import { useViewMode, ViewMode } from "@/hooks/use-view-mode"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Monitor, Moon, Sun, Layout, List, Maximize, Columns, AlignLeft } from "lucide-react"
import { useEffect, useState } from "react"
import SaveStatus from "./SaveStatus"

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme()
  const { viewMode, changeViewMode, isMounted } = useViewMode()
  const [mounted, setMounted] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("saved")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isMounted) return null

  const handleThemeChange = (value: string) => {
    setSaveStatus("saving")
    setTheme(value)
    setTimeout(() => setSaveStatus("saved"), 500)
  }

  const handleViewModeChange = (value: ViewMode) => {
    setSaveStatus("saving")
    changeViewMode(value)
    setTimeout(() => setSaveStatus("saved"), 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">表示 / UI</h2>
          <p className="text-muted-foreground">
            アプリケーションの見た目や記事の表示スタイルをカスタマイズします。
          </p>
        </div>
        <SaveStatus status={saveStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テーマ</CardTitle>
          <CardDescription>
            アプリケーションの配色を選択します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue={theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="light" id="light" className="peer sr-only" />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Sun className="mb-3 h-6 w-6" />
                ライト
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Moon className="mb-3 h-6 w-6" />
                ダーク
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system" className="peer sr-only" />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Monitor className="mb-3 h-6 w-6" />
                システム
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>記事の表示モード</CardTitle>
          <CardDescription>
            ホーム画面や一覧ページでの記事の表示スタイルを選択します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue={viewMode}
            onValueChange={(v) => handleViewModeChange(v as ViewMode)}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {[
              { id: "card", label: "カード", icon: Layout },
              { id: "list", label: "リスト", icon: List },
              { id: "compact", label: "コンパクト", icon: AlignLeft },
              { id: "magazine", label: "マガジン", icon: Columns },
              { id: "text", label: "テキスト", icon: Maximize },
            ].map((mode) => (
              <div key={mode.id}>
                <RadioGroupItem value={mode.id} id={mode.id} className="peer sr-only" />
                <Label
                  htmlFor={mode.id}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <mode.icon className="mb-3 h-6 w-6" />
                  <span className="text-xs">{mode.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}

export default AppearanceSettings
