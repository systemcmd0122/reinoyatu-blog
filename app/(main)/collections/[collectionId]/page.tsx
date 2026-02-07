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
import { CollectionWithItemsType } from "@/types"

interface CollectionDetailPageProps {
  params: Promise<{
    collectionId: string
  }>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Sidebar - Collection Info */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 z-[var(--z-sticky)] space-y-8">
            <Link 
              href={`/profile/${collection.profiles.id}`} 
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {collection.profiles.name}のプロフィールに戻る
            </Link>

            <div className="relative aspect-video rounded-3xl overflow-hidden border border-border shadow-2xl group bg-gradient-to-br from-primary/20 to-secondary/20">
              {blogs[0]?.image_url ? (
                <Image 
                  src={blogs[0].image_url} 
                  alt={collection.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-16 w-16 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 {blogs.length > 0 && (
                   <Button asChild className="rounded-full h-16 w-16 p-0 shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                     <Link href={`/blog/${blogs[0].id}?collection=${collection.id}`}>
                       <Play className="h-8 w-8 ml-1" />
                     </Link>
                   </Button>
                 )}
              </div>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-widest">
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
              
              <h1 className="text-3xl font-black tracking-tight leading-tight">
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

              <div className="flex items-center gap-3 pt-6">
                {blogs.length > 0 && (
                  <Button asChild size="lg" className="flex-1 rounded-2xl font-black shadow-lg shadow-primary/20">
                    <Link href={`/blog/${blogs[0].id}?collection=${collection.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      最初から読む
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl shrink-0">
                  <Share2 className="h-5 w-5" />
                </Button>
                {isOwner && (
                  <div className="flex gap-2">
                    <CollectionManageDialog collection={collection} />
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl shrink-0">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Post List */}
        <div className="lg:col-span-8 space-y-8">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
               この記事シリーズ
               <span className="text-sm font-medium text-muted-foreground ml-2">({blogs.length}件)</span>
             </h2>
           </div>

           {blogs.length > 0 ? (
             <div className="space-y-4">
               {blogs.map((blog: any, index: number) => (
                 <Link 
                   key={blog.id} 
                   href={`/blog/${blog.id}?collection=${collection.id}`}
                   className="group block"
                 >
                   <div className="flex gap-4 p-4 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                     <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-lg font-black text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                       {index + 1}
                     </div>
                     
                     {blog.image_url && (
                       <div className="hidden sm:block flex-shrink-0 w-32 aspect-video rounded-xl overflow-hidden border border-border">
                         <Image src={blog.image_url} alt={blog.title} width={128} height={72} className="object-cover w-full h-full" />
                       </div>
                     )}

                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
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

                     <div className="flex-shrink-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight className="h-5 w-5 text-primary" />
                     </div>
                   </div>
                 </Link>
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
      </div>
    </div>
  )
}
