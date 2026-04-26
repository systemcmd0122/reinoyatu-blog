"use client"

import React, { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"
import Image from "next/image"
import { getUserImages } from "@/actions/image"
import { cn } from "@/lib/utils"

interface ImageLibraryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (imageUrl: string) => void
}

interface ImageItem {
    id: string
    public_url: string
    created_at: string
}

export const ImageLibraryDialog: React.FC<ImageLibraryDialogProps> = ({
    open,
    onOpenChange,
    onSelect,
}) => {
    const [images, setImages] = useState<ImageItem[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            loadImages()
        }
    }, [open])

    const loadImages = async () => {
        setLoading(true)
        try {
            const res = await getUserImages()
            if (res.success && res.data) {
                setImages(res.data)
            }
        } catch (err) {
            console.error("Failed to load images:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredImages = images.filter(img =>
        img.id.includes(searchTerm) || img.public_url.includes(searchTerm)
    )

    const handleSelect = (imageUrl: string, imageId: string) => {
        setSelectedId(imageId)
        onSelect(imageUrl)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>画像ライブラリから選択</DialogTitle>
                    <DialogDescription>
                        アップロード済みの画像から選択します。同じ画像を再利用することでストレージを節約できます。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="画像を検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {images.length === 0 ? "アップロード済みの画像がまだありません" : "検索条件に一致する画像がありません"}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                            {filteredImages.map((image) => (
                                <button
                                    key={image.id}
                                    onClick={() => handleSelect(image.public_url, image.id)}
                                    className={cn(
                                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:border-primary",
                                        selectedId === image.id ? "border-primary ring-2 ring-primary/50" : "border-border"
                                    )}
                                >
                                    <Image
                                        src={image.public_url}
                                        alt="Library image"
                                        fill
                                        className="object-cover hover:opacity-75 transition-opacity"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            キャンセル
                        </Button>
                        <Button onClick={() => onOpenChange(false)} disabled={!selectedId}>
                            選択
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
