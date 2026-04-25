import React from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Globe, ExternalLink } from 'lucide-react'

const IframeView = (props: any) => {
  const { src } = props.node.attrs

  return (
    <NodeViewWrapper className="iframe-view my-6 border-2 border-border rounded-2xl overflow-hidden bg-card shadow-lg group transition-all hover:shadow-xl">
      <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-bold truncate max-w-[250px] md:max-w-md text-muted-foreground">
            {src}
          </span>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="relative w-full aspect-video bg-muted/20">
        <iframe
          src={src}
          className="w-full h-full border-none"
          title="Embedded content"
          allowFullScreen
        />
      </div>
    </NodeViewWrapper>
  )
}

export default IframeView
