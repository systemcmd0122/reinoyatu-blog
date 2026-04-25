import React from 'react'
import { Globe, ExternalLink } from 'lucide-react'

interface IframeEmbedProps {
  src: string
}

const IframeEmbed: React.FC<IframeEmbedProps> = ({ src }) => {
  return (
    <div className="iframe-embed my-8 border-2 border-border rounded-2xl overflow-hidden bg-card shadow-lg transition-all hover:shadow-xl">
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-md text-muted-foreground">
            {src}
          </span>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary group"
        >
          <ExternalLink className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </a>
      </div>
      <div className="relative w-full aspect-video bg-muted/20">
        <iframe
          src={src}
          className="w-full h-full border-none"
          title="Embedded content"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  )
}

export default IframeEmbed
