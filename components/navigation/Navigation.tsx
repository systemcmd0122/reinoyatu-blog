"use client"

import { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import {
  LogOut,
  Settings,
  PenSquare,
  Menu,
  Shield,
  House,
  Bookmark,
  User as UserIcon,
  FileText,
  Search,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "./ThemeToggle"
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
  const supabase = createClient()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState<{ avatar_url: string | null; name: string | null } | null>(null)

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
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
    router.refresh()
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

  const DesktopMenu = () => (
    <div className="hidden md:flex items-center space-x-4">
      <ThemeToggle />
      <form onSubmit={handleSearch} className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="記事を検索..."
          className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      {user ? (
        <>
          <Button variant="ghost" asChild>
            <Link href="/guide/markdown" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>マークダウンガイド</span>
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/blog/new" className="flex items-center space-x-2">
              <PenSquare className="h-4 w-4" />
              <span>投稿する</span>
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/bookmarks" className="flex items-center space-x-2">
              <Bookmark className="h-4 w-4" />
              <span>ブックマーク</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profile?.avatar_url || "/default.png"}
                    alt={profile?.name || "User"}
                  />
                  <AvatarFallback>
                    {profile?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.name || "ユーザー"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {userNavigationItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href(user.id)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsLogoutDialogOpen(true)}
                className="text-red-500 focus:text-red-500 focus:bg-red-50/50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild>
            <Link href="/login">ログイン</Link>
          </Button>
          <Button variant="default" asChild>
            <Link href="/signup">新規登録</Link>
          </Button>
        </>
      )}
    </div>
  )

  const mobileNavItems = [
    { href: "/", icon: House, label: "ホーム" },
    { href: "/guide/markdown", icon: FileText, label: "マークダウンガイド" },
    { href: "/blog/new", icon: PenSquare, label: "投稿する" },
    { href: "/bookmarks", icon: Bookmark, label: "ブックマーク" },
    { href: "/settings/profile", icon: Settings, label: "設定" },
    { href: "/privacy", icon: Shield, label: "プライバシーポリシー" },
  ]

  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs p-0 bg-background border-l border-border">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <ThemeToggle />
            <form onSubmit={handleSearch} className="relative flex-1 ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="記事を検索..."
                className="pl-9 bg-background border-border h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          {user ? (
            <>
              <div className="p-4 border-b border-border">
                <Link href={`/profile/${user.id}`} className="block">
                  <SheetClose asChild>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={profile?.avatar_url || "/default.png"}
                          alt={profile?.name || "User"}
                        />
                        <AvatarFallback>
                          {profile?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold truncate">
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
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="p-4 border-t border-border mt-auto bg-muted/10">
                <SheetClose asChild>
                  <button
                    onClick={() => setIsLogoutDialogOpen(true)}
                    className="flex items-center w-full space-x-3 px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>ログアウト</span>
                  </button>
                </SheetClose>
              </div>
            </>
          ) : (
            <div className="flex flex-col p-4 space-y-2 mt-6">
              <SheetClose asChild>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-md text-center font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  ログイン
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/signup"
                  className="px-4 py-2.5 rounded-md text-center font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  新規登録
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/privacy"
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md hover:bg-accent text-foreground/80 hover:text-accent-foreground transition-colors"
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
  )

  return (
    <>
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="font-bold text-xl hover:opacity-80 transition-opacity"
            >
              例のヤツ｜ブログ
            </Link>

            <div className="flex items-center">
              <DesktopMenu />
              <MobileMenu />
            </div>
          </div>
        </div>
      </header>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のアカウントからログアウトします。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
              ログアウト
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Navigation