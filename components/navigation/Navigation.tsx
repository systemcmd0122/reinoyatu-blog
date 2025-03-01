"use client"

import { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Settings, PenSquare, Menu, Shield, House, Bookmark } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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

const Navigation = ({ user }: NavigationProps) => {
  const router = useRouter()
  const supabase = createClient()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // デスクトップ用のナビゲーションメニュー
  const DesktopMenu = () => (
    <div className="hidden md:flex items-center space-x-4">
      {user ? (
        <>
          <Button variant="ghost" asChild>
            <Link href="/blog/new" className="flex items-center space-x-2">
              <PenSquare className="h-4 w-4" />npm
              <span>投稿</span>
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/bookmarks" className="flex items-center space-x-2">
            <Bookmark className="h-4 w-4" />
            <span>ブックマーク一覧</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">プロフィール設定</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/privacy" className="flex items-center space-x-2">
                  プライバシーポリシー
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault()
                  setIsLogoutDialogOpen(true)
                }} 
                className="text-red-600"
              >
                ログアウト
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

  // モバイル用のナビゲーションメニュー
  const MobileMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="bg-white/95 backdrop-blur-md"
      >
        <div className="flex flex-col space-y-4 mt-6">
          {user ? (
            <>
             <SheetClose asChild>
                <Link
                  href="/"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  <House className="h-4 w-4" />
                  <span>ホーム</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/blog/new"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  <PenSquare className="h-4 w-4" />
                  <span>投稿</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/bookmarks"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>ブックマーク一覧</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/settings/profile"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4" />
                  <span>設定</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/privacy"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  <Shield className="h-4 w-4" />
                  <span>プライバシーポリシー</span>
                </Link>
              </SheetClose>
              <button
                onClick={() => setIsLogoutDialogOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-slate-100 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>ログアウト</span>
              </button>
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  ログイン
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                >
                  新規登録
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/privacy"
                  className="px-4 py-2 rounded-md hover:bg-slate-100"
                >
                  プライバシーポリシー
                </Link>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      <header className="border-b bg-white/75 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-screen-lg px-4 py-4 flex items-center justify-between">
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
      </header>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-white border shadow-lg rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトの確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当にログアウトしますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>ログアウト</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default Navigation