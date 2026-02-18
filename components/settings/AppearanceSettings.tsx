"use client"

import { useTheme } from "next-themes"
import { useViewMode, ViewMode } from "@/hooks/use-view-mode"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Monitor, Moon, Sun, Layout, List, Maximize, Columns, AlignLeft, Download, Share, Smartphone, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import SaveStatus from "./SaveStatus"

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme()
  const { viewMode, changeViewMode, isMounted } = useViewMode()
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()
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

      <Card className="overflow-hidden border-2 border-primary/10">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            PWA設定
          </CardTitle>
          <CardDescription>
            アプリとしてインストールして、オフライン閲覧やプッシュ通知（今後対応予定）を利用しましょう。
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isInstalled ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="p-4 bg-green-500/10 text-green-500 rounded-full">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h4 className="font-black text-lg">インストール済みです</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ホーム画面やランチャーから直接起動して、最高の体験をお楽しみいただけます。
                </p>
              </div>
            </div>
          ) : isInstallable || isIOS ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-6 bg-primary/10 text-primary rounded-2xl shrink-0">
                {isIOS ? (
                  <Share className="h-12 w-12" />
                ) : (
                  <Download className="h-12 w-12" />
                )}
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h4 className="font-black text-xl">アプリをインストールする</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isIOS 
                      ? "iOSでは共有ボタンから「ホーム画面に追加」を選択してください。"
                      : "デスクトップやAndroidでは、ボタンをクリックするだけで簡単にインストールできます。"}
                  </p>
                </div>
                {!isIOS && (
                  <Button 
                    onClick={() => promptInstall()}
                    className="w-full md:w-auto font-black px-8 h-12 shadow-lg shadow-primary/20"
                  >
                    今すぐインストール
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                お使いのブラウザは現在PWAのインストールに対応していないか、既にインストールされています。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AppearanceSettings
