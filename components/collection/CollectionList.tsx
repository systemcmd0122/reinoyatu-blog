"use client"

import { CollectionType } from "@/types"
import Link from "next/link"
import { Play, Layers, ChevronRight, Lock, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface CollectionListProps {
  collections: CollectionType[]
  isOwnProfile?: boolean
}

const CollectionList: React.FC<CollectionListProps> = ({ collections, isOwnProfile = false }) => {
  if (collections.length === 0) {
    return (
      <div className="bg-card border border-border border-dashed rounded-[2rem] p-20 text-center">
        <div className="bg-muted w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Layers className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-bold mb-2">コレクションが見つかりません</h3>
        <p className="text-muted-foreground">
          {isOwnProfile ? "記事をグループ化してプレイリストを作成しましょう。" : "このユーザーはまだ公開コレクションを作成していません。"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {collections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/collections/${collection.id}`}>
            <Card className="group rounded-[2rem] border-border/50 overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500">
                  <Play className="h-12 w-12 text-primary/40 group-hover:scale-125 transition-transform duration-500" />

                  {/* Playlist Overlay Effect */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-black/10 backdrop-blur-sm border-l border-white/10 flex flex-col items-center justify-center">
                     <Layers className="h-6 w-6 text-white/60 mb-1" />
                     <span className="text-white font-black text-sm">{collection.item_count}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                         {collection.is_public ? (
                           <Globe className="h-3 w-3 text-muted-foreground" />
                         ) : (
                           <Lock className="h-3 w-3 text-amber-500" />
                         )}
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                           {collection.is_public ? "Public Series" : "Private Series"}
                         </span>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                        {collection.title}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="bg-muted p-2 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 self-center">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

export default CollectionList
