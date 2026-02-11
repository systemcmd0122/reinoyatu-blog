"use client"

import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserImages } from "@/actions/image"
import { Loader2, ImageIcon, Check } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageLibraryDialogProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string) => void
}

const ImageLibraryDialog: React.FC<ImageLibraryDialogProps> = ({
  userId,
  isOpen,
  onClose,
  onSelect,
}) => {
  const [images, setImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchImages()
    }
  }, [isOpen, userId])

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const result = await getUserImages(userId)
      if (result.success) {
        setImages(result.images || [])
      }
    } catch (err) {
      console.error("Failed to fetch images:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
      setSelectedUrl(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            メディアライブラリ
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm font-bold">画像を読み込み中...</p>
            </div>
          ) : images.length > 0 ? (
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all",
                      selectedUrl === img.public_url
                        ? "border-primary"
                        : "border-transparent hover:border-primary/30"
                    )}
                    onClick={() => setSelectedUrl(img.public_url)}
                  >
                    <Image
                      src={img.public_url}
                      alt="Uploaded"
                      fill
                      className="object-cover"
                    />
                    {selectedUrl === img.public_url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1 shadow-lg">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm font-bold">画像が見つかりません</p>
              <p className="text-xs">アップロードした画像がここに表示されます</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedUrl}
            className="font-bold"
          >
            選択した画像を使用する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImageLibraryDialog
