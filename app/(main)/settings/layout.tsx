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
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

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
        name: "下書き一覧",
        icon: FileText,
        href: "/settings/drafts",
        description: "未公開の記事を編集・管理"
      },
      {
        name: "アカウント",
        icon: Mail,
        href: "/settings/account",
        description: "メールアドレスとアカウント管理"
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
                    "w-full justify-start h-auto py-3 px-4",
                    isActive 
                      ? "bg-primary/10 text-primary hover:bg-primary/15" 
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
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-bold">
                <div className="flex items-center">
                  <Menu className="h-5 w-5 mr-2" />
                  設定メニュー
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">開く</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[300px] bg-card text-card-foreground border-r p-0"
            >
              <div className="p-6 pt-12">
                <div className="flex items-center space-x-2 mb-8 px-2">
                  <UserCircle className="w-8 h-8 text-primary" />
                  <span className="font-black text-xl tracking-tighter italic">SETTINGS</span>
                </div>
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar for Desktop */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0">
          <div className="sticky top-24 z-[var(--z-sticky)]">
            <div className="flex items-center space-x-2 mb-8 px-4">
              <UserCircle className="w-6 h-6 text-primary" />
              <span className="font-black text-lg tracking-tighter italic uppercase">Settings</span>
            </div>
            <NavContent />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-6 lg:p-10 border border-border transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout
