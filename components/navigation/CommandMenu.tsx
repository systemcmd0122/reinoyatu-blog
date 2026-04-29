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
  Laptop,
  Rocket,
  Sparkles
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
import Image from "next/image"
import { useDebounce } from "@/hooks/use-debounce"
import { User as SupabaseUser } from "@supabase/supabase-js"

interface CommandMenuProps {
  user: SupabaseUser | null
}

export function CommandMenu({ user }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [blogs, setBlogs] = React.useState<{id: string, title: string, image_url: string | null}[]>([])
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
        className="relative flex items-center w-full transition-all duration-300 border border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-border/80 h-10 px-4 py-2 text-sm font-bold text-muted-foreground shadow-sm rounded-full group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Search className="mr-3 h-4 w-4 text-primary transition-transform group-hover:scale-110" />
        <span className="hidden lg:inline-flex relative">記事や機能を検索...</span>
        <span className="inline-flex lg:hidden relative">検索...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center gap-1 rounded-full border bg-background px-2.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm sm:flex transition-transform group-hover:translate-x-[-2px]">
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
                  className="p-2"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative h-10 w-16 shrink-0 rounded-md overflow-hidden border bg-muted">
                      {blog.image_url ? (
                        <Image src={blog.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full">
                          <FileText className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <span className="truncate font-bold flex-1">{blog.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {(!query || "ホーム".includes(query) || "AIで作成".includes(query)) && (
            <CommandGroup heading="ナビゲーション">
              <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                <Home className="mr-2 h-4 w-4" />
                <span>ホーム</span>
              </CommandItem>
              {user && (
                <>
                  <CommandItem onSelect={() => runCommand(() => router.push("/blog/ai-new"))} className="text-primary font-bold">
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>AIで作成</span>
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => router.push("/blog/new"))}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>記事を投稿する</span>
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => router.push("/bookmarks"))}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>ブックマーク</span>
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          )}

          {(!query || (user && "プロフィール設定".includes(query)) || "マークダウンガイド".includes(query) || "アップデートログ".includes(query)) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="設定・ツール">
                {user && (!query || "プロフィール設定".includes(query)) && (
                  <CommandItem onSelect={() => runCommand(() => router.push("/settings/profile"))}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>プロフィール設定</span>
                  </CommandItem>
                )}
                {(!query || "アップデートログ".includes(query)) && (
                  <CommandItem onSelect={() => runCommand(() => router.push("/changelog"))}>
                    <Rocket className="mr-2 h-4 w-4" />
                    <span>アップデートログ</span>
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
