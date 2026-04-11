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
    <div className="space-y-8">
      {navigation.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
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
                    "w-full justify-start h-auto py-4 px-4 rounded-[1.25rem] transition-all duration-300 active:scale-[0.97]",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90"
                      : "hover:bg-primary/5 hover:text-primary"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href} className="flex items-start">
                    <item.icon className={cn("w-5 h-5 mr-4 mt-0.5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="font-black text-sm tracking-tight leading-tight">{item.name}</span>
                      <span className={cn(
                        "text-[10px] font-bold truncate w-full mt-0.5",
                        isActive ? "text-primary-foreground/60" : "text-muted-foreground/60"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-12 lg:py-24 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-black glass rounded-2xl h-16 shadow-premium px-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Menu className="h-6 w-6 text-primary" />
                  </div>
                  <span className="uppercase tracking-widest text-xs">Settings Menu</span>
                </div>
                <div className="bg-muted px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest opacity-60">Open</div>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-full sm:w-[380px] bg-background/80 backdrop-blur-2xl text-card-foreground border-r border-border/40 p-0 rounded-r-[3rem]"
            >
              <VisuallyHidden>
                <SheetTitle>設定メニュー</SheetTitle>
              </VisuallyHidden>
              <div className="p-8 pt-16">
                <div className="flex items-center space-x-3 mb-12 px-2">
                  <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg shadow-primary/20">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <span className="font-black text-2xl tracking-tighter italic uppercase">Settings</span>
                </div>
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar for Desktop */}
        <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0">
          <div className="sticky top-24 z-[var(--z-sticky)]">
            <div className="flex items-center space-x-3 mb-10 px-4">
              <div className="bg-primary/5 p-2 rounded-xl">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="font-black text-xl tracking-tighter italic uppercase opacity-40">System Preferences</span>
            </div>
            <NavContent />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-card text-card-foreground shadow-premium rounded-[3rem] p-8 lg:p-16 border border-border/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsLayout
