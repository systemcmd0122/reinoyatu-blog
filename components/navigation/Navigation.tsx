"use client"

import { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  LogOut,
  Settings,
  PenSquare,
  Menu,
  Shield,
  House,
  Bookmark,
  Bell,
  User as UserIcon,
  FileText,
  Search,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "./ThemeToggle"
import { CommandMenu } from "./CommandMenu"
import { useRealtime } from "@/hooks/use-realtime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NavigationProps {
  user: User | null
}

const Navigation = ({ user: initialUser }: NavigationProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState<{ avatar_url: string | null; name: string | null } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          setUser(session?.user || null)
          router.refresh()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  // リアルタイム通知の購読
  const lastNotifyEvent = useRealtime('notifications', {
    event: 'INSERT',
    filter: user ? `user_id=eq.${user.id}` : undefined
  })

  useEffect(() => {
    if (lastNotifyEvent) {
      setUnreadCount(prev => prev + 1)
      toast.info("新しい通知があります")
    }
  }, [lastNotifyEvent])

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single()
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    }
    fetchProfile()
  }, [user, supabase])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
      router.refresh()
    } finally {
      setIsLoggingOut(false)
      setIsLogoutDialogOpen(false)
    }
  }

  const userNavigationItems = [
    {
      href: (userId: string) => `/profile/${userId}`,
      icon: UserIcon,
      label: "プロフィール",
      desktop: true,
    },
    {
      href: () => "/settings/profile",
      icon: Settings,
      label: "設定",
      desktop: true,
    },
    {
      href: () => "/privacy",
      icon: Shield,
      label: "プライバシーポリシー",
      desktop: true,
    },
  ]

  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const mobileNavItems = [
    { href: "/", icon: House, label: "ホーム" },
    { href: "/changelog", icon: FileText, label: "アップデート" },
    { href: "/guide/markdown", icon: FileText, label: "マークダウンガイド" },
    { href: "/blog/new", icon: PenSquare, label: "投稿する" },
    { href: "/bookmarks", icon: Bookmark, label: "ブックマーク" },
    { href: "/settings/profile", icon: Settings, label: "設定" },
    { href: "/privacy", icon: Shield, label: "プライバシーポリシー" },
  ]

  // エディターページではナビゲーションを非表示にする
  const isEditorPage = pathname === "/blog/new" || /^\/blog\/[^/]+\/edit$/.test(pathname || "")

  if (isEditorPage) return null

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-[var(--z-nav)] w-full">
        <div className="max-w-screen-xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md font-black text-xl leading-none shadow-sm">
                RY
              </div>
              <span className="font-black text-lg md:text-xl tracking-tighter hidden sm:inline-block text-foreground">
                例のヤツ
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 ml-4">
              <Link
                href="/changelog"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                アップデート
              </Link>
            </nav>

            <div className="hidden md:flex flex-1 justify-center max-w-sm ml-4">
              <CommandMenu user={user} />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <div className="hidden md:flex items-center gap-1">
              {user && (
                <>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground relative" asChild>
                    <Link href="/notifications" title="通知">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                    <Link href="/bookmarks" title="ブックマーク">
                      <Bookmark className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" asChild className="hidden sm:flex gap-2 rounded-md px-4 font-bold shadow-sm">
                  <Link href="/blog/new">
                    <PenSquare className="h-4 w-4" />
                    <span>投稿する</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-colors hover:bg-muted">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage
                          src={profile?.avatar_url || "/default.png"}
                          alt={profile?.name || "User"}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs">
                          {profile?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">
                          {profile?.name || "ユーザー"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.id}`} className="cursor-pointer">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>プロフィール</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings/profile" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>設定</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="md:hidden">
                        <Link href="/bookmarks" className="cursor-pointer">
                          <Bookmark className="mr-2 h-4 w-4" />
                          <span>ブックマーク</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsLogoutDialogOpen(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>ログアウト</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login">ログイン</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full px-4 shadow-sm">
                  <Link href="/signup">はじめる</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs p-0 bg-background border-l border-border">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <div className="flex-1">
                      <CommandMenu user={user} />
                    </div>
                  </div>
                  {user ? (
                    <>
                      <div className="p-6 border-b border-border bg-muted/10">
                        <Link href={`/profile/${user.id}`} className="block group">
                          <SheetClose asChild>
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-14 w-14 border-2 border-primary/20 transition-all group-hover:border-primary">
                                <AvatarImage
                                  src={profile?.avatar_url || "/default.png"}
                                  alt={profile?.name || "User"}
                                />
                                <AvatarFallback>
                                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col truncate">
                                <span className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                  {profile?.name || "ユーザー"}
                                </span>
                                <span className="text-sm text-muted-foreground truncate">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </SheetClose>
                        </Link>
                      </div>
                      <nav className="flex-1 p-4 space-y-2">
                        {mobileNavItems.map((item) => (
                          <SheetClose asChild key={item.label}>
                            <Link
                              href={item.href}
                              className="flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-all active:scale-95"
                            >
                              <div className="p-2 bg-muted-foreground/10 rounded-lg">
                                <item.icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <span>{item.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                      <div className="p-4 border-t border-border mt-auto bg-muted/5">
                        <SheetClose asChild>
                          <button
                            onClick={() => setIsLogoutDialogOpen(true)}
                            className="flex items-center w-full space-x-4 px-4 py-3 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                          >
                            <div className="p-2 bg-destructive/10 rounded-lg">
                              <LogOut className="h-5 w-5" />
                            </div>
                            <span>ログアウト</span>
                          </button>
                        </SheetClose>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col p-6 space-y-4">
                      <SheetClose asChild>
                        <Link
                          href="/login"
                          className="flex items-center justify-center h-12 rounded-xl font-bold border border-border hover:bg-muted transition-all active:scale-95"
                        >
                          ログイン
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/signup"
                          className="flex items-center justify-center h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-md transition-all active:scale-95"
                        >
                          今すぐはじめる
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/privacy"
                          className="flex items-center justify-center space-x-2 py-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Shield className="h-4 w-4" />
                          <span>プライバシーポリシー</span>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のアカウントからログアウトします。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 処理中...</>
              ) : (
                "ログアウト"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Navigation
