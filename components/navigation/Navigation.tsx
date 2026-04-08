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
  Download,
  Share,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { CommandMenu } from "./CommandMenu"
import { useNotifications } from "@/hooks/use-notifications"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import MobileNav from "./MobileNav"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
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
  const { unreadCount } = useNotifications(user?.id)
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()

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

  const mobileNavItems = [
    { href: "/changelog", icon: FileText, label: "アップデート" },
    { href: "/settings/drafts", icon: FileText, label: "記事管理" },
    { href: "/settings/profile", icon: Settings, label: "設定" },
    { href: "/privacy", icon: Shield, label: "プライバシーポリシー" },
  ]

  // エディターページではナビゲーションを非表示にする
  const isEditorPage = pathname === "/blog/new" || /^\/blog\/[^/]+\/edit$/.test(pathname || "")

  if (isEditorPage) return null

  return (
    <>
      <header className="border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-[var(--z-nav)] w-full transition-all duration-300">
        <div className="max-w-screen-xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-all flex-shrink-0 group"
            >
              <div className="bg-primary text-primary-foreground p-2 rounded-xl font-black text-xl leading-none shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                RY
              </div>
              <span className="font-black text-xl tracking-tighter hidden sm:inline-block text-foreground">
                例のヤツ
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8 ml-8">
              <Link
                href="/changelog"
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors tracking-tight"
              >
                アップデート
              </Link>
            </nav>

            <div className="hidden md:flex flex-1 justify-center max-w-sm ml-8">
              <CommandMenu user={user} />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
              {user && (
                <>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative rounded-xl hover:bg-primary/5" asChild>
                    <Link href="/notifications" title="通知">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background animate-pulse" />
                      )}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary rounded-xl hover:bg-primary/5">
                    <Link href="/bookmarks" title="ブックマーク">
                      <Bookmark className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              )}
              <div className="w-[1px] h-4 bg-border mx-1" />
              <ThemeToggle />
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="default" size="sm" asChild className="hidden sm:flex gap-2 rounded-xl px-5 font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Link href="/blog/new">
                    <PenSquare className="h-4 w-4" />
                    <span>投稿する</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-offset-background transition-all hover:bg-muted active:scale-90 p-0 overflow-hidden border border-border">
                      <Avatar className="h-full w-full">
                        <AvatarImage
                          src={profile?.avatar_url || "/default.png"}
                          alt={profile?.name || "User"}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
                          {profile?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl shadow-2xl border-border/50" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-black leading-none">
                          {profile?.name || "ユーザー"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate opacity-70">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="opacity-50" />
                    <DropdownMenuGroup className="p-1">
                      <DropdownMenuItem asChild className="rounded-xl p-2 cursor-pointer font-bold">
                        <Link href={`/profile/${user.id}`}>
                          <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>プロフィール</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl p-2 cursor-pointer font-bold">
                        <Link href="/settings/drafts">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>記事管理</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl p-2 cursor-pointer font-bold">
                        <Link href="/settings/profile">
                          <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>設定</span>
                        </Link>
                      </DropdownMenuItem>
                      {(isInstallable || isIOS) && !isInstalled && (
                        <DropdownMenuItem
                          onClick={() => promptInstall()}
                          className="rounded-xl p-2 cursor-pointer font-bold"
                        >
                          {isIOS ? (
                            <Share className="mr-2 h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          <span>アプリをインストール</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="opacity-50" />
                    <DropdownMenuItem
                      onClick={() => setIsLogoutDialogOpen(true)}
                      className="rounded-xl p-2 text-destructive focus:text-destructive cursor-pointer font-black"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>ログアウト</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex font-bold rounded-xl hover:bg-muted transition-colors px-6">
                  <Link href="/login">ログイン</Link>
                </Button>
                <Button size="sm" asChild className="rounded-xl px-6 font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Link href="/signup">はじめる</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Trigger - Kept for secondary links but bottom nav handles primary */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-muted active:scale-90">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs p-0 bg-background/80 backdrop-blur-xl border-l border-border rounded-l-3xl overflow-hidden">
                <VisuallyHidden>
                  <SheetTitle>メニュー</SheetTitle>
                </VisuallyHidden>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                    <span className="font-black text-xl tracking-tighter">Menu</span>
                    <ThemeToggle />
                  </div>
                  {user ? (
                    <>
                      <div className="p-8 border-b border-border bg-muted/10">
                        <Link href={`/profile/${user.id}`} className="block group">
                          <SheetClose asChild>
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-16 w-16 border-2 border-primary/20 transition-all group-hover:border-primary shadow-xl">
                                <AvatarImage
                                  src={profile?.avatar_url || "/default.png"}
                                  alt={profile?.name || "User"}
                                />
                                <AvatarFallback className="font-black">
                                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col truncate">
                                <span className="font-black text-xl truncate group-hover:text-primary transition-colors">
                                  {profile?.name || "ユーザー"}
                                </span>
                                <span className="text-sm text-muted-foreground truncate opacity-70">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </SheetClose>
                        </Link>
                      </div>
                      <nav className="flex-1 p-6 space-y-3">
                        {mobileNavItems.map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <SheetClose asChild key={item.label}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center space-x-4 px-5 py-4 rounded-[1.25rem] text-lg font-bold transition-all active:scale-95",
                                  isActive
                                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <item.icon className={cn(
                                  "h-6 w-6",
                                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                                )} />
                                <span>{item.label}</span>
                              </Link>
                            </SheetClose>
                          )
                        })}
                      </nav>
                      <div className="p-6 border-t border-border mt-auto bg-muted/5">
                        <SheetClose asChild>
                          <button
                            onClick={() => setIsLogoutDialogOpen(true)}
                            className="flex items-center w-full space-x-4 px-6 py-4 rounded-[1.25rem] text-lg font-black text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                          >
                            <LogOut className="h-6 w-6" />
                            <span>ログアウト</span>
                          </button>
                        </SheetClose>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col p-8 space-y-5">
                      <SheetClose asChild>
                        <Link
                          href="/login"
                          className="flex items-center justify-center h-14 rounded-2xl font-black text-lg border-2 border-border hover:bg-muted transition-all active:scale-95"
                        >
                          ログイン
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/signup"
                          className="flex items-center justify-center h-14 rounded-2xl font-black text-lg bg-primary text-primary-foreground hover:opacity-90 shadow-2xl shadow-primary/20 transition-all active:scale-95"
                        >
                          今すぐはじめる
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

      {/* Mobile Bottom Navigation */}
      <MobileNav userId={user?.id} unreadCount={unreadCount} />

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">ログアウトしますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium">
              現在のアカウントからログアウトします。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel disabled={isLoggingOut} className="rounded-xl h-12 font-bold border-2">キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl h-12 font-black"
            >
              {isLoggingOut ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> 処理中...</>
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
