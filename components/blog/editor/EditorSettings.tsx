"use client"

import React from "react"
import { useFormContext } from "react-hook-form"
import { 
  Type, 
  ImagePlus, 
  Upload, 
  FileText, 
  Layers, 
  Library, 
  Lock, 
  Tag,
  Link as LinkIcon,
  Globe,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import Image from "next/image"
import TagInput from "@/components/ui/TagInput"
import CollectionDialog from "@/components/collection/CollectionDialog"
import { CollectionType } from "@/types"
import { toast } from "sonner"
import ImageLibraryDialog from "./ImageLibraryDialog"
import CoAuthorSelector from "./CoAuthorSelector"

interface EditorSettingsProps {
  userId: string
  watchedContent: string
  watchedSummary: string | undefined
  watchedTags: string[] | undefined
  imagePreview: string | null
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  setImageFile: (file: File | null) => void
  setImagePreview: (preview: string | null) => void
  userCollections: CollectionType[]
  setUserCollections: (collections: CollectionType[]) => void
  selectedCollections: string[]
  setSelectedCollections: (collections: string[]) => void
  setIsDirty: (isDirty: boolean) => void
  initialCoAuthors?: { id: string, name: string, avatar_url: string | null }[]
}

const EditorSettings: React.FC<EditorSettingsProps> = ({
  userId,
  watchedContent,
  watchedSummary,
  watchedTags,
  imagePreview,
  handleImageUpload,
  setImageFile,
  setImagePreview,
  userCollections,
  setUserCollections,
  selectedCollections,
  setSelectedCollections,
  setIsDirty,
  initialCoAuthors,
}) => {
  const { setValue, getValues } = useFormContext()
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false)

  return (
    <div className="space-y-10">

      {/* 要約設定 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            要約 (Summary)
          </h4>
        </div>

        <Textarea 
          value={watchedSummary || ""}
          onChange={(e) => setValue("summary", e.target.value)}
          placeholder="記事の概要を簡潔に入力してください..."
          className="min-h-[120px] text-sm bg-muted/20 border-border focus-visible:ring-primary leading-relaxed rounded-xl p-4"
        />
      </section>

      {/* コレクション設定 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            シリーズに追加
          </h4>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {userCollections.length > 0 ? (
            userCollections.map(collection => (
              <div key={collection.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`col-${collection.id}`} 
                  checked={selectedCollections.includes(collection.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCollections([...selectedCollections, collection.id])
                    } else {
                      setSelectedCollections(selectedCollections.filter(id => id !== collection.id))
                    }
                    setIsDirty(true)
                  }}
                />
                <label 
                  htmlFor={`col-${collection.id}`}
                  className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  {collection.title}
                  {!collection.is_public && <Lock className="h-3 w-3 text-amber-500" />}
                </label>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground italic">コレクションがありません。</p>
          )}
        </div>
        <CollectionDialog 
          userId={userId} 
          onSuccess={(newCol: any) => {
            setUserCollections([newCol, ...userCollections])
          }}
        />
      </section>

      {/* 共同投稿者設定 */}
      <section className="space-y-4">
        <CoAuthorSelector currentUserId={userId} initialUsers={initialCoAuthors} />
      </section>

      {/* タグ設定 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" />
            タグ
          </h4>
        </div>

        <TagInput 
          value={watchedTags || []}
          onChange={(tags) => setValue("tags", tags)}
          placeholder="タグを追加..."
          className="bg-muted/20 border-border rounded-xl"
        />
        <p className="text-[10px] text-muted-foreground italic px-1">最大10個まで。Enterで確定。</p>
      </section>
    </div>
  )
}

export default EditorSettings
