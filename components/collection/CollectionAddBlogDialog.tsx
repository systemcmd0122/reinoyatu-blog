"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Search, Loader2, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchBlogs } from "@/actions/blog"
import { addBlogToCollection } from "@/actions/collection"
import { toast } from "sonner"
import Image from "next/image"

interface CollectionAddBlogDialogProps {
  collectionId: string
  userId: string
  onSuccess?: () => void
}

export default function CollectionAddBlogDialog({ collectionId, userId, onSuccess }: CollectionAddBlogDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const { blogs, error } = await searchBlogs(query, userId)
      if (error) {
        toast.error(error)
      } else {
        setResults(blogs || [])
      }
    } catch (error) {
      toast.error("検索に失敗しました")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAdd = async (blogId: string) => {
    setIsAdding(blogId)
    try {
      const res = await addBlogToCollection(collectionId, blogId)
      if (res.success) {
        toast.success("シリーズに追加しました")
        if (onSuccess) onSuccess()
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error("追加に失敗しました")
    } finally {
      setIsAdding(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-bold gap-2">
          <Plus className="h-4 w-4" />
          記事を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">記事を追加</DialogTitle>
          <DialogDescription>
            このシリーズに追加したい記事を検索して選択してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトルや内容で検索..."
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Button type="submit" disabled={isSearching} className="h-11 rounded-xl font-bold px-6">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "検索"}
          </Button>
        </form>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {results.length > 0 ? (
            results.map((blog) => (
              <div key={blog.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                <div className="min-w-0 flex-1 pr-4">
                  <h4 className="font-bold text-sm truncate">{blog.title}</h4>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAdd(blog.id)}
                  disabled={isAdding === blog.id}
                  variant="ghost"
                  className="rounded-lg font-bold h-8 text-xs hover:bg-primary/10 hover:text-primary"
                >
                  {isAdding === blog.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      追加
                    </>
                  )}
                </Button>
              </div>
            ))
          ) : query && !isSearching ? (
            <p className="text-center py-8 text-sm text-muted-foreground italic">
              見つかりませんでした。
            </p>
          ) : (
             <div className="text-center py-12 text-muted-foreground/40">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Search your articles</p>
             </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
