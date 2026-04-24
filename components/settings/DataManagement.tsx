"use client"

import { useState } from "react"
import {
  FileText,
  Layers,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Search
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  deleteImage,
  deleteAllUserData
} from "@/actions/data"
import { deleteBlog } from "@/actions/blog"
import { deleteCollection } from "@/actions/collection"
import { formatJST } from "@/utils/date"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"

interface DataManagementProps {
  userId: string
  stats: {
    blogsCount: number
    collectionsCount: number
    imagesCount: number
    likesCount: number
    bookmarksCount: number
  }
  initialBlogs: any[]
  initialCollections: any[]
  initialImages: any[]
}

export default function DataManagement({
  userId,
  stats: initialStats,
  initialBlogs,
  initialCollections,
  initialImages
}: DataManagementProps) {
  const [stats, setStats] = useState(initialStats)
  const [blogs, setBlogs] = useState(initialBlogs)
  const [collections, setCollections] = useState(initialCollections)
  const [images, setImages] = useState(initialImages)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDeleteBlog = async (blogId: string) => {
    try {
      const res = await deleteBlog({ blogId, imageUrl: null, userId })
      if (res?.error) {
        toast.error(res.error)
      } else {
        setBlogs(blogs.filter(b => b.id !== blogId))
        setStats(prev => ({ ...prev, blogsCount: prev.blogsCount - 1 }))
        toast.success("記事を削除しました")
      }
    } catch (error) {
      toast.error("削除に失敗しました")
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const res = await deleteCollection(collectionId, userId)
      if (res.success) {
        setCollections(collections.filter(c => c.id !== collectionId))
        setStats(prev => ({ ...prev, collectionsCount: prev.collectionsCount - 1 }))
        toast.success("シリーズを削除しました")
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error("削除に失敗しました")
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await deleteImage(imageId)
      if (res.success) {
        setImages(images.filter(i => i.id !== imageId))
        setStats(prev => ({ ...prev, imagesCount: prev.imagesCount - 1 }))
        toast.success("画像をライブラリから削除しました")
      } else {
        toast.error(res.error || "画像が他の記事で使用されているため削除できません")
      }
    } catch (error) {
      toast.error("削除に失敗しました")
    }
  }

  const handleDeleteAll = async () => {
    setIsDeletingAll(true)
    try {
      const res = await deleteAllUserData()
      if (res.success) {
        toast.success("すべてのデータを削除しました")
        window.location.reload()
      } else {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error("処理中にエラーが発生しました")
    } finally {
      setIsDeletingAll(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-2">データ管理</h2>
        <p className="text-muted-foreground">
          作成した記事、シリーズ、アップロードした画像などの管理と一括削除が行えます。
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "記事", value: stats.blogsCount, icon: FileText, color: "text-blue-500" },
          { label: "シリーズ", value: stats.collectionsCount, icon: Layers, color: "text-purple-500" },
          { label: "画像", value: stats.imagesCount, icon: ImageIcon, color: "text-green-500" },
          { label: "合計反応", value: stats.likesCount + stats.bookmarksCount, icon: AlertTriangle, color: "text-amber-500" },
        ].map((item, i) => (
          <Card key={i} className="border-border/50 shadow-sm overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">合計</span>
              </div>
              <div className="text-2xl font-black group-hover:scale-110 transition-transform origin-left">{item.value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="blogs" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="blogs" className="font-bold">記事 ({blogs.length})</TabsTrigger>
          <TabsTrigger value="collections" className="font-bold">シリーズ ({collections.length})</TabsTrigger>
          <TabsTrigger value="images" className="font-bold">ライブラリ ({images.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="blogs" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {blogs.length > 0 ? (
              <div className="divide-y divide-border/50">
                {blogs.map(blog => (
                  <div key={blog.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="font-bold text-sm truncate">{blog.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatJST(blog.created_at)}</span>
                        {blog.is_published ? (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-1.5 py-0.5 rounded">Public</span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Draft</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                        <Link href={`/blog/${blog.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。「{blog.title}」を完全に削除します。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBlog(blog.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              削除する
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground italic">記事が見つかりません。</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {collections.length > 0 ? (
              <div className="divide-y divide-border/50">
                {collections.map(col => (
                  <div key={col.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="font-bold text-sm truncate">{col.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatJST(col.created_at)}</span>
                        {col.is_public ? (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-1.5 py-0.5 rounded">Public</span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">Private</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                        <Link href={`/collections/${col.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>シリーズを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              このシリーズ「{col.title}」を削除します。シリーズに含まれる記事は削除されません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCollection(col.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              削除する
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground italic">シリーズが見つかりません。</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ファイル名で検索... (Coming soon)"
              className="pl-10 h-10 rounded-xl"
              disabled
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.length > 0 ? (
              images.map(img => (
                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                  <Image src={img.public_url} alt="Library" fill className="object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" asChild>
                      <a href={img.public_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>画像を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            ライブラリからこの画像を削除します。記事で使用されている場合は削除できません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteImage(img.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center text-muted-foreground italic">画像が見つかりません。</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Danger Zone */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-xl font-black uppercase tracking-tighter text-destructive">危険地帯</h3>
        </div>

        <Card className="border-destructive/20 bg-destructive/5 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">全データの消去</CardTitle>
            <CardDescription className="text-destructive/80">
              あなたが作成したすべての記事、シリーズ、画像を完全に消去します。この操作は取り消せません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="font-bold rounded-xl h-11 px-8 shadow-lg shadow-destructive/20">
                  すべてのデータを削除する
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-destructive/50">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">本当にすべてのデータを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作を実行すると、記事、シリーズ、ライブラリ画像、ブックマーク、いいね等のすべてのデータが失われます。
                    アカウント自体は削除されません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    disabled={isDeletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                  >
                    {isDeletingAll ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 削除中...</>
                    ) : (
                      "理解した上で削除する"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
