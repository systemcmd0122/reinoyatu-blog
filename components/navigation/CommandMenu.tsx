"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  FileText,
  Plus,
  Bookmark,
  Home,
  LogOut,
  Moon,
  Sun,
  Laptop
} from "lucide-react"

import { DialogTitle } from "@/components/ui/dialog"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { searchBlogs } from "@/actions/blog"
import { useDebounce } from "@/hooks/use-debounce"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [blogs, setBlogs] = React.useState<{id: string, title: string}[]>([])
  const [loading, setLoading] = React.useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    setQuery("")
    command()
  }, [])

  React.useEffect(() => {
    if (!debouncedQuery) {
      setBlogs([])
      return
    }

    const fetchBlogs = async () => {
      setLoading(true)
      const { blogs } = await searchBlogs(debouncedQuery)
      setBlogs(blogs)
      setLoading(false)
    }

    fetchBlogs()
  }, [debouncedQuery])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-muted/40 hover:bg-muted h-9 px-4 py-2 justify-start text-sm font-medium text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64 rounded-md group"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">記事や機能を検索...</span>
        <span className="inline-flex lg:hidden">検索...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex group-hover:bg-background">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open)
          if (!open) setQuery("")
        }}
        shouldFilter={false}
      >
        <DialogTitle className="sr-only">コマンドメニュー</DialogTitle>
        <CommandInput
          placeholder="記事や機能を検索..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && <div className="p-4 text-sm text-center text-muted-foreground">検索中...</div>}
          {!loading && query && blogs.length === 0 && (
            <CommandEmpty>記事が見つかりませんでした。</CommandEmpty>
          )}

          {blogs.length > 0 && (
            <CommandGroup heading="記事">
              {blogs.map((blog) => (
                <CommandItem
                  key={blog.id}
                  value={blog.id}
                  onSelect={() => runCommand(() => router.push(`/blog/${blog.id}`))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="truncate">{blog.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {(!query || "ホーム".includes(query)) && (
            <CommandGroup heading="ナビゲーション">
              <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                <Home className="mr-2 h-4 w-4" />
                <span>ホーム</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/blog/new"))}>
                <Plus className="mr-2 h-4 w-4" />
                <span>記事を投稿する</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/bookmarks"))}>
                <Bookmark className="mr-2 h-4 w-4" />
                <span>ブックマーク</span>
              </CommandItem>
            </CommandGroup>
          )}

          {(!query || "プロフィール設定".includes(query) || "マークダウンガイド".includes(query)) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="設定・ツール">
                {(!query || "プロフィール設定".includes(query)) && (
                  <CommandItem onSelect={() => runCommand(() => router.push("/settings/profile"))}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>プロフィール設定</span>
                  </CommandItem>
                )}
                {(!query || "マークダウンガイド".includes(query)) && (
                  <CommandItem onSelect={() => runCommand(() => router.push("/guide/markdown"))}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>マークダウンガイド</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}

          {!query && (
            <>
              <CommandSeparator />
              <CommandGroup heading="テーマ">
                <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>ライトモード</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>ダークモード</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>システム設定に従う</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
