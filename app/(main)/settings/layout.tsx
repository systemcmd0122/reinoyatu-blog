"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { UserRoundPen, Mail, KeyRound, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// ナビゲーション
const subNavigation = [
  {
    name: "プロフィール",
    icon: UserRoundPen,
    href: "/settings/profile",
  },
  {
    name: "メールアドレス変更",
    icon: Mail,
    href: "/settings/email",
  },
  {
    name: "パスワード変更",
    icon: KeyRound,
    href: "/settings/password",
  }
]

// レイアウト
const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const NavButtons = () => (
    <>
      {subNavigation.map((item, index) => (
        <Button
          asChild
          key={index}
          variant="ghost"
          className={cn(
            "w-full justify-start font-bold text-left",
            pathname === item.href && "bg-primary/10 text-primary",
            "hover:bg-primary/10 transition-colors duration-200"
          )}
          onClick={() => setIsOpen(false)}
        >
          <Link href={item.href}>
            <item.icon className="inline-block w-5 h-5 mr-2" />
            {item.name}
          </Link>
        </Button>
      ))}
    </>
  )

  return (
    <div className="container mx-auto px-4 py-6 md:max-w-4xl">
      {/* Mobile Navigation */}
      <div className="md:hidden mb-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[270px] bg-white" 
            style={{ backgroundColor: 'white' }}
          >
            <div className="flex flex-col space-y-2 pt-8">
              <NavButtons />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar for Desktop */}
        <div className="hidden md:block space-y-2">
          <NavButtons />
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 bg-white shadow-sm rounded-lg p-6 border">
          {children}
        </div>
      </div>
    </div>
  )
}

export default SettingsLayout