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
  Bookmark
} from "lucide-react"
import { motion } from "framer-motion"

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
      label: "投稿",
      icon: PlusSquare,
      href: "/blog/new",
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

  // Only show on mobile
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-nav)] px-4 pb-4 pointer-events-none">
      <nav className="glass rounded-[2rem] shadow-2xl border-white/20 h-20 flex items-center justify-around pointer-events-auto overflow-hidden px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 touch-none",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-all duration-500",
                isActive && "bg-primary/10",
                item.primary && "bg-primary text-primary-foreground shadow-xl shadow-primary/30 -translate-y-4 scale-125"
              )}>
                <item.icon className={cn(
                  "h-6 w-6",
                  item.primary && "h-6 w-6"
                )} />

                {item.badge && (
                  <span className="absolute top-3 right-1/2 translate-x-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
              </div>

              {!item.primary && (
                <span className={cn(
                  "text-[10px] font-black mt-1 transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}>
                  {item.label}
                </span>
              )}

              {isActive && !item.primary && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-2.5 w-1 h-1 bg-primary rounded-full"
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
