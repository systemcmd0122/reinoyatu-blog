"use client"

import React from "react"
import { useFormContext } from "react-hook-form"
import { 
  Type, 
  Wand2, 
  Loader2, 
  Sparkles, 
  ImagePlus, 
  Upload, 
  FileText, 
  Layers, 
  Lock, 
  Tag 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import Image from "next/image"
import TagInput from "@/components/ui/TagInput"
import CollectionDialog from "@/components/collection/CollectionDialog"
import { CollectionType } from "@/types"
import { toast } from "sonner"

interface EditorSettingsProps {
  userId: string
  watchedContent: string
  watchedSummary: string | undefined
  watchedTags: string[] | undefined
  aiSuggestion: {
    type: "summary" | "tags" | "titles"
    content: string | string[]
  } | null
  setAiSuggestion: (suggestion: any) => void
  isTitleGenerating: boolean
  handleGenerateTitles: () => Promise<void>
  isGeneratingSummary: boolean
  handleGenerateSummary: () => Promise<void>
  isTagGenerating: boolean
  handleGenerateTags: () => Promise<void>
  applyAiSuggestion: () => Promise<void>
  imagePreview: string | null
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  setImageFile: (file: File | null) => void
  setImagePreview: (preview: string | null) => void
  userCollections: CollectionType[]
  setUserCollections: (collections: CollectionType[]) => void
  selectedCollections: string[]
  setSelectedCollections: (collections: string[]) => void
  setIsDirty: (isDirty: boolean) => void
}

const EditorSettings: React.FC<EditorSettingsProps> = ({
  userId,
  watchedContent,
  watchedSummary,
  watchedTags,
  aiSuggestion,
  setAiSuggestion,
  isTitleGenerating,
  handleGenerateTitles,
  isGeneratingSummary,
  handleGenerateSummary,
  isTagGenerating,
  handleGenerateTags,
  applyAiSuggestion,
  imagePreview,
  handleImageUpload,
  setImageFile,
  setImagePreview,
  userCollections,
  setUserCollections,
  selectedCollections,
  setSelectedCollections,
  setIsDirty,
}) => {
  const { setValue, getValues } = useFormContext()

  return (
    <div className="space-y-10">
      {/* タイトル提案 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Type className="h-4 w-4" />
            タイトル提案
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGenerateTitles}
            disabled={isTitleGenerating || !watchedContent}
            className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
          >
            {isTitleGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
            AI提案
          </Button>
        </div>

        {aiSuggestion?.type === "titles" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3"
          >
            <p className="text-xs text-primary font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              タイトル案:
            </p>
            <div className="space-y-2">
              {(aiSuggestion.content as string[]).map((title, i) => (
                <div key={i} className="flex items-center justify-between group/title">
                  <p className="text-xs font-medium leading-tight pr-2">{title}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 text-[9px] font-bold shrink-0 opacity-0 group-hover/title:opacity-100 transition-opacity"
                    onClick={() => {
                      setValue("title", title, { shouldValidate: true })
                      toast.success("タイトルを適用しました")
                      setAiSuggestion(null)
                    }}
                  >
                    適用
                  </Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="h-6 w-full text-[9px] font-bold mt-2" onClick={() => setAiSuggestion(null)}>
              閉じる
            </Button>
          </motion.div>
        )}
        <p className="text-[10px] text-muted-foreground italic px-1">本文の内容に基づいて魅力的なタイトルを提案します。</p>
      </section>

      {/* カバー画像設定 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            カバー画像
          </h4>
        </div>
        <div className="group relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-muted hover:border-primary/50 transition-all cursor-pointer bg-muted/20">
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="Cover" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => document.getElementById('sidebar-image-upload')?.click()}>
                  変更
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                  削除
                </Button>
              </div>
            </>
          ) : (
            <label htmlFor="sidebar-image-upload" className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
              <p className="text-xs font-bold text-muted-foreground group-hover:text-primary">画像をアップロード</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">2MB以内の JPG, PNG, WebP</p>
            </label>
          )}
          <input id="sidebar-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
      </section>

      {/* 要約設定 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            要約 (Summary)
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary || !watchedContent}
            className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
          >
            {isGeneratingSummary ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
            AI生成
          </Button>
        </div>

        {aiSuggestion?.type === "summary" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3"
          >
            <p className="text-xs text-primary font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AIによる要約案:
            </p>
            <p className="text-xs leading-relaxed">{aiSuggestion.content as string}</p>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-[10px] font-bold" onClick={applyAiSuggestion}>
                適用する
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => setAiSuggestion(null)}>
                破棄
              </Button>
            </div>
          </motion.div>
        )}

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

      {/* タグ設定 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" />
            タグ
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGenerateTags}
            disabled={isTagGenerating || !watchedContent}
            className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary"
          >
            {isTagGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
            AI提案
          </Button>
        </div>

        {aiSuggestion?.type === "tags" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3"
          >
            <p className="text-xs text-primary font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              おすすめのタグ:
            </p>
            <div className="flex flex-wrap gap-2">
              {(aiSuggestion.content as string[]).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-[10px] font-bold" onClick={applyAiSuggestion}>
                全て追加
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => setAiSuggestion(null)}>
                破棄
              </Button>
            </div>
          </motion.div>
        )}

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
