import { notFound } from "next/navigation"
import { getCollectionWithItems } from "@/actions/collection"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Play,
  Clock,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Lock,
  Globe,
  Layers,
} from "lucide-react"
import { formatJST } from "@/utils/date"
import Image from "next/image"
import CollectionManageDialog from "@/components/collection/CollectionManageDialog"
import CollectionShareButton from "@/components/collection/CollectionShareButton"
import BlogActionMenu from "@/components/blog/BlogActionMenu"
import { CollectionWithItemsType } from "@/types"
import { Metadata } from "next"
import * as motion from "framer-motion/client"

interface CollectionDetailPageProps {
  params: Promise<{ collectionId: string }>
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const { collectionId } = await params
  const collection = await getCollectionWithItems(collectionId) as unknown as CollectionWithItemsType | null
  if (!collection) return { title: "コレクションが見つかりません" }
  return {
    title: collection.title,
    description: collection.description || `${collection.profiles.name}による記事コレクションです。`,
  }
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { collectionId } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const collection = await getCollectionWithItems(collectionId) as unknown as CollectionWithItemsType | null
  if (!collection) return notFound()

  if (!collection.is_public && user?.id !== collection.user_id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
        <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold mb-2">このコレクションは非公開です</h2>
        <p className="text-muted-foreground mb-8">お探しのコレクションは現在非公開に設定されています。</p>
        <Link href="/"><Button variant="outline">トップページに戻る</Button></Link>
      </div>
    )
  }

  const blogs = collection.collection_items?.map((item: any) => ({
    ...item.blogs,
    profiles: item.blogs.profiles,
  })) || []

  const isOwner = user?.id === collection.user_id

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ── Left sidebar ── */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6 bg-card/60 backdrop-blur-xl p-7 rounded-[2.5rem] border border-border/50 shadow-xl shadow-primary/5">

            {/* Back link */}
            <Link
              href={`/profile/${collection.profiles.id}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              {collection.profiles.name}
            </Link>

            {/* Cover image */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-br from-primary/15 to-secondary/15 group">
              {blogs[0]?.image_url ? (
                <Image
                  src={blogs[0].image_url}
                  alt={collection.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="p-5 rounded-full bg-primary/10">
                    <Play className="h-10 w-10 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/40">Series</span>
                </div>
              )}

              {/* Overlay play button */}
              {blogs.length > 0 && (
                <Link
                  href={`/blog/${blogs[0].id}?collection=${collection.id}`}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                >
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                    <Play className="h-7 w-7 text-primary-foreground ml-1" />
                  </div>
                </Link>
              )}

              {/* Article count badge */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest">
                {blogs.length} 記事
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                {collection.is_public ? (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Lock className="h-3 w-3 text-amber-500" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {collection.is_public ? "Public Series" : "Private Series"}
                </span>
              </div>

              {/* Title — full text, no truncation */}
              <h1 className="text-3xl font-black tracking-tight leading-tight">
                {collection.title}
              </h1>

              {collection.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5 border border-border">
                    <AvatarImage src={collection.profiles.avatar_url || "/default.png"} />
                    <AvatarFallback className="text-[8px]">{collection.profiles.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-bold">{collection.profiles.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatJST(collection.created_at)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {blogs.length > 0 && (
                <Button asChild size="lg" className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                  <Link href={`/blog/${blogs[0].id}?collection=${collection.id}`}>
                    <Play className="h-4 w-4 mr-2 fill-current" />
                    最初から再生
                  </Link>
                </Button>
              )}
              <div className="flex gap-2">
                <CollectionShareButton title={collection.title} />
                {isOwner && <CollectionManageDialog collection={collection} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right content — article list ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-5">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Playlist
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {blogs.length} 件
              </span>
            </h2>
          </div>

          {blogs.length > 0 ? (
            <div className="space-y-3">
              {blogs.map((blog: any, index: number) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                >
                  <Link
                    href={`/blog/${blog.id}?collection=${collection.id}`}
                    className="group block"
                  >
                    <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                      {/* Number badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-sm font-black text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {index + 1}
                      </div>

                      {/* Thumbnail */}
                      {blog.image_url && (
                        <div className="hidden sm:block flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border border-border/40">
                          <Image
                            src={blog.image_url}
                            alt={blog.title}
                            width={96}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}

                      {/* Title + date — full title, wraps naturally */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors break-words">
                          {blog.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatJST(blog.created_at)}
                          </span>
                          {blog.is_published === false && (
                            <span className="text-amber-500 font-bold uppercase tracking-widest text-[8px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {user?.id === blog.user_id && (
                            <BlogActionMenu blog={blog} isOwner />
                          )}
                          <ChevronRight className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border border-dashed rounded-2xl p-16 text-center">
              <div className="bg-muted w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-base font-bold mb-1">コレクションは空です</h3>
              <p className="text-sm text-muted-foreground">
                このシリーズにはまだ記事が追加されていません。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}