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
  Share2,
  Lock,
  Globe,
  MoreVertical
} from "lucide-react"
import { formatJST } from "@/utils/date"
import Image from "next/image"
import BlogListView from "@/components/blog/BlogListView"
import CollectionManageDialog from "@/components/collection/CollectionManageDialog"
import CollectionShareButton from "@/components/collection/CollectionShareButton"
import CollectionAddBlogDialog from "@/components/collection/CollectionAddBlogDialog"
import BlogActionMenu from "@/components/blog/BlogActionMenu"
import { CollectionWithItemsType } from "@/types"
import { Metadata } from "next"
import * as motion from "framer-motion/client"

interface CollectionDetailPageProps {
  params: Promise<{
    collectionId: string
  }>
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const { collectionId } = await params
  const collection = await getCollectionWithItems(collectionId) as unknown as CollectionWithItemsType | null

  if (!collection) {
    return {
      title: "コレクションが見つかりません",
    }
  }

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

  if (!collection) {
    return notFound()
  }

  // 非公開コレクションの権限チェック
  if (!collection.is_public && user?.id !== collection.user_id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">このコレクションは非公開です</h2>
        <p className="text-muted-foreground mb-8">お探しのコレクションは現在非公開に設定されています。</p>
        <Link href="/">
          <Button variant="outline">トップページに戻る</Button>
        </Link>
      </div>
    )
  }

  const blogs = collection.collection_items?.map((item: any) => ({
    ...item.blogs,
    profiles: item.blogs.profiles
  })) || []

  const isOwner = user?.id === collection.user_id

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-12"
      >
        {/* Left Sidebar - Collection Info */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 z-[var(--z-sticky)] space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-[3rem] border border-border/50 shadow-2xl shadow-primary/5">
            <Link 
              href={`/profile/${collection.profiles.id}`} 
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to {collection.profiles.name}
            </Link>

            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-background shadow-[0_20px_50px_rgba(0,0,0,0.2)] group bg-gradient-to-br from-primary/20 to-secondary/20">
              {blogs[0]?.image_url ? (
                <Image 
                  src={blogs[0].image_url} 
                  alt={collection.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="p-6 rounded-full bg-primary/10">
                    <Play className="h-12 w-12 text-primary" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/40">Series Playlist</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
                 {blogs.length > 0 && (
                   <Button asChild className="rounded-full h-20 w-20 p-0 shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500 hover:h-24 hover:w-24">
                     <Link href={`/blog/${blogs[0].id}?collection=${collection.id}`}>
                       <Play className="h-10 w-10 ml-1.5" />
                     </Link>
                   </Button>
                 )}
              </div>
              <div className="absolute bottom-6 right-6 bg-primary text-primary-foreground text-[10px] font-black px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest shadow-xl">
                {blogs.length} Articles
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {collection.is_public ? (
                  <Globe className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Lock className="h-3 w-3 text-amber-500" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {collection.is_public ? "Public Series" : "Private Series"}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] bg-gradient-to-br from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
                {collection.title}
              </h1>
              
              {collection.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={collection.profiles.avatar_url || "/default.png"} />
                    <AvatarFallback>{collection.profiles.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold">{collection.profiles.name}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatJST(collection.created_at)}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-8">
                {blogs.length > 0 && (
                  <Button asChild size="lg" className="w-full rounded-[1.25rem] h-14 font-black shadow-xl shadow-primary/20 text-lg">
                    <Link href={`/blog/${blogs[0].id}?collection=${collection.id}`}>
                      <Play className="h-5 w-5 mr-3 fill-current" />
                      最初から再生
                    </Link>
                  </Button>
                )}
                <div className="flex gap-3">
                  <CollectionShareButton title={collection.title} />
                  {isOwner && (
                    <CollectionManageDialog collection={collection} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Post List */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex items-center justify-between border-b border-border/50 pb-6">
             <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
               <Layers className="h-6 w-6 text-primary" />
               Playlist Content
               <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full ml-2">
                 {blogs.length} items
               </span>
             </h2>
           </div>

           {blogs.length > 0 ? (
             <div className="space-y-4">
               {blogs.map((blog: any, index: number) => (
                 <motion.div
                   key={blog.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.05 }}
                 >
                 <Link 
                   href={`/blog/${blog.id}?collection=${collection.id}`}
                   className="group block"
                 >
                   <div className="flex gap-6 p-6 rounded-[2rem] bg-card border border-border hover:border-primary/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500 group relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                     <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-xl font-black text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm z-10">
                       {index + 1}
                     </div>
                     
                     {blog.image_url && (
                       <div className="hidden sm:block flex-shrink-0 w-32 aspect-video rounded-xl overflow-hidden border border-border">
                         <Image src={blog.image_url} alt={blog.title} width={128} height={72} className="object-cover w-full h-full" />
                       </div>
                     )}

                     <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
                       <h3 className="font-black text-xl group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
                         {blog.title}
                       </h3>
                       <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                         <span className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {formatJST(blog.created_at)}
                         </span>
                         {blog.is_published === false && (
                           <span className="text-amber-500 font-bold uppercase tracking-widest text-[8px] bg-amber-500/10 px-1.5 rounded">Draft</span>
                         )}
                       </div>
                     </div>

                     <div className="flex-shrink-0 flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <BlogActionMenu blog={blog} isOwner={user?.id === blog.user_id} />
                       <ChevronRight className="h-5 w-5 text-primary" />
                     </div>
                   </div>
                 </Link>
                 </motion.div>
               ))}
             </div>
           ) : (
             <div className="bg-card border border-border border-dashed rounded-[2rem] p-20 text-center">
                <div className="bg-muted w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Play className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold mb-2">コレクションは空です</h3>
                <p className="text-muted-foreground">
                  このシリーズにはまだ記事が追加されていません。
                </p>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  )
}
