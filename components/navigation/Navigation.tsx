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
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
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

  const DesktopMenu = () => (
    <div className="hidden md:flex items-center space-x-2">
      {user ? (
        <>
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
                    src={user.user_metadata.avatar_url || "/default.png"}
                    alt={user.user_metadata.name || "User"}
                  />
                  <AvatarFallback>
                    {user.user_metadata.name?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.user_metadata.name || "ユーザー"}
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
      <SheetContent side="right" className="w-full max-w-xs p-0">
        <div className="flex flex-col h-full">
          {user ? (
            <>
              <div className="p-4 border-b">
                <Link href={`/profile/${user.id}`} className="block">
                  <SheetClose asChild>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.user_metadata.avatar_url || "/default.png"}
                          alt={user.user_metadata.name || "User"}
                        />
                        <AvatarFallback>
                          {user.user_metadata.name?.charAt(0).toUpperCase() ||
                            user.email?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <span className="font-semibold truncate">
                          {user.user_metadata.name || "ユーザー"}
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
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <item.icon className="h-5 w-5 text-gray-500" />
                      <span>{item.label}</span>
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="p-4 border-t mt-auto">
                <SheetClose asChild>
                  <button
                    onClick={() => setIsLogoutDialogOpen(true)}
                    className="flex items-center w-full space-x-3 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50/80"
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
                  className="px-4 py-2.5 rounded-md text-center font-medium text-gray-700 hover:bg-gray-100"
                >
                  ログイン
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/signup"
                  className="px-4 py-2.5 rounded-md text-center font-medium text-white bg-gray-900 hover:bg-gray-800"
                >
                  新規登録
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/privacy"
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md hover:bg-gray-100"
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