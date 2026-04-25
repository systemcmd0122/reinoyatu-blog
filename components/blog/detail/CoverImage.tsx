import React from "react"
import Image from "next/image"

interface CoverImageProps {
  url: string | null
  title: string
}

const CoverImage: React.FC<CoverImageProps> = ({ url, title }) => {
  if (!url) return null

  return (
    <div className="mb-12 relative aspect-video rounded-2xl overflow-hidden border border-border shadow-md">
      <Image
        src={url}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
        priority
        unoptimized
      />
    </div>
  )
}

export default CoverImage
