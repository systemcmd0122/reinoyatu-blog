"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { shareContent } from "@/utils/share"

interface CollectionShareButtonProps {
  title: string
}

export default function CollectionShareButton({ title }: CollectionShareButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-12 w-12 rounded-2xl shrink-0"
      onClick={() => shareContent({
        title: `シリーズ: ${title}`,
        url: window.location.href
      })}
    >
      <Share2 className="h-5 w-5" />
    </Button>
  )
}
