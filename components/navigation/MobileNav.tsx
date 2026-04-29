"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  House,
  PlusSquare,
  Bell,
  User,
  Bookmark,
  Sparkles,
  PenSquare,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface MobileNavProps {
  userId?: string | null
  unreadCount?: number
}

const MobileNav: React.FC<MobileNavProps> = ({ userId, unreadCount = 0 }) => {
  const pathname = usePathname()

  const navItems = [
    {
      label: "ホーム",
      icon: House,
      href: "/",
    },
    {
      label: "通知",
      icon: Bell,
      href: "/notifications",
      badge: unreadCount > 0
    },
    {
      label: "作成",
      icon: PlusSquare,
      href: "#create",
      primary: true,
    },
    {
      label: "ブックマーク",
      icon: Bookmark,
      href: "/bookmarks",
    },
    {
      label: "プロフィール",
      icon: User,
      href: userId ? `/profile/${userId}` : "/login",
    },
  ]

  const isEditorPage = pathname === "/blog/new" || pathname === "/blog/ai-new" || /^\/blog\/[^/]+\/edit$/.test(pathname || "")

  if (isEditorPage) return null

  // Only show on mobile
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-nav)] px-4 pb-4 pointer-events-none">
      <nav className="glass rounded-[2rem] shadow-2xl border-white/20 h-16 flex items-center justify-around pointer-events-auto overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          if (item.primary) {
            return (
              <Sheet key={item.label}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "relative flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 pointer-events-auto",
                      "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-2xl transition-all duration-300 bg-primary text-primary-foreground shadow-lg shadow-primary/20 -translate-y-1 scale-110"
                    )}>
                      <item.icon className="h-7 w-7" />
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2rem] p-6 pb-12 border-t-0 bg-background/95 backdrop-blur-xl">
                  <VisuallyHidden>
                    <SheetTitle>作成メニュー</SheetTitle>
                  </VisuallyHidden>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <SheetClose asChild>
                      <Link
                        href="/blog/new"
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-muted/50 hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/20 group"
                      >
                        <div className="p-4 rounded-2xl bg-background shadow-sm group-hover:scale-110 transition-transform">
                          <PenSquare className="h-8 w-8" />
                        </div>
                        <span className="font-bold text-sm">記事を書く</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/blog/ai-new"
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:opacity-90 transition-all group"
                      >
                        <div className="p-4 rounded-2xl bg-primary-foreground/10 group-hover:scale-110 transition-transform">
                          <Sparkles className="h-8 w-8" />
                        </div>
                        <span className="font-bold text-sm">AIで作成</span>
                      </Link>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full transition-all active:scale-90 pointer-events-auto",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive && "bg-primary/10"
              )}>
                <item.icon className="h-6 w-6" />

                {item.badge && (
                  <span className="absolute top-2 right-1/2 translate-x-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
              </div>

              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileNav
