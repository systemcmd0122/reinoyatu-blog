"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  UserRoundPen,
  Mail,
  KeyRound,
  Menu,
  LayoutDashboard,
  Bell,
  ShieldCheck,
  UserCircle,
  FileText,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

// ナビゲーション
const navigation = [
  {
    title: "基本設定",
    items: [
      {
        name: "プロフィール",
        icon: UserRoundPen,
        href: "/settings/profile",
        description: "名前、自己紹介、アイコンの設定"
      },
      {
        name: "記事管理",
        icon: FileText,
        href: "/settings/drafts",
        description: "作成した記事の管理・編集"
      },
      {
        name: "アカウント",
        icon: Mail,
        href: "/settings/account",
        description: "メールアドレスとアカウント管理"
      },
      {
        name: "データ管理",
        icon: ShieldCheck,
        href: "/settings/data",
        description: "作成したデータの確認と削除"
      },
      {
        name: "AIを育てる",
        icon: Sparkles,
        href: "/settings/ai",
        description: "AIのカスタマイズとキャッシュ管理"
      },
    ]
  },
  {
    title: "アプリケーション",
    items: [
      {
        name: "表示 / UI",
        icon: LayoutDashboard,
        href: "/settings/appearance",
        description: "テーマと表示スタイルのカスタマイズ"
      },
      {
        name: "通知",
        icon: Bell,
        href: "/settings/notifications",
        description: "各種イベントの通知設定"
      },
    ]
  },
  {
    title: "セキュリティ",
    items: [
      {
        name: "セキュリティ",
        icon: ShieldCheck,
        href: "/settings/security",
        description: "パスワードと安全性の設定"
      },
    ]
  }
]

// レイアウト
const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const NavContent = () => (
    <div className="space-y-6">
      {navigation.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-2">
          <h3 className="px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map((item, itemIdx) => {
              const isActive = pathname === item.href
              return (
                <Button
                  asChild
                  key={itemIdx}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto py-2.5 px-4 rounded-md",
                    isActive
                      ? "bg-primary/5 text-primary hover:bg-primary/10"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href} className="flex items-start">
                    <item.icon className={cn("w-5 h-5 mr-3 mt-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="font-bold text-sm leading-tight">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground font-medium truncate w-full">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
          {groupIdx < navigation.length - 1 && <Separator className="mt-4 mx-2" />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6 lg:py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Mobile Navigation - native list style */}
        <div className="md:hidden space-y-6">
          {pathname === "/settings" || pathname === "/settings/" ? (
            <div className="space-y-6 animate-in">
              {navigation.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-2">
                  <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </h3>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                    {group.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className="flex items-center justify-between p-4 active:bg-muted transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mr-4 text-primary">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight">{item.name}</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              {item.description}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center mb-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold h-9 px-4 border-dashed"
                onClick={() => setIsOpen(true)}
              >
                <Menu className="h-4 w-4 mr-2" />
                他の設定
              </Button>
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent
              side="bottom"
              className="rounded-t-[2rem] p-0 overflow-hidden bg-background/95 backdrop-blur-xl"
            >
              <VisuallyHidden>
                <SheetTitle>設定メニュー</SheetTitle>
              </VisuallyHidden>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center space-x-2 mb-6 px-2 border-b pb-4">
                  <UserCircle className="w-6 h-6 text-primary" />
                  <span className="font-bold text-lg">設定メニュー</span>
                </div>
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar for Desktop */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
          <div className="sticky top-24 z-[var(--z-sticky)]">
            <div className="flex items-center space-x-2 mb-6 px-4 border-b pb-4 border-border">
              <UserCircle className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">設定</span>
            </div>
            <NavContent />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-card text-card-foreground shadow-sm rounded-lg p-6 lg:p-10 border border-border transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout
