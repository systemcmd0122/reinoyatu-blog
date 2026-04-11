import React from "react"
import Image from "next/image"

interface CoverImageProps {
  url: string | null
  title: string
}

const CoverImage: React.FC<CoverImageProps> = ({ url, title }) => {
  if (!url) return null

  return (
    <div className="mb-16 md:mb-24 relative aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-border/40 shadow-premium">
      <Image
        src={url}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
        priority
      />
    </div>
  )
}

export default CoverImage
