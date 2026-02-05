import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Settings2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default ({ node, updateAttributes }: any) => {
  const { src, showDetails } = node.attrs;
  const embedUrl = `https://www.youtube.com/embed/${src}`;

  return (
    <NodeViewWrapper className="youtube-container my-8 relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-8 gap-2 bg-background/80 backdrop-blur"
          onClick={() => updateAttributes({ showDetails: !showDetails })}
        >
          {showDetails ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {showDetails ? "詳細を表示中" : "詳細を非表示"}
        </Button>
      </div>
      
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-border">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          allowFullScreen
          frameBorder="0"
          title="YouTube Video"
        />
      </div>
      
      {showDetails && (
        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-2 px-2">
          <Settings2 className="h-3 w-3" />
          <span>YouTube ID: {src} | 詳細表示有効</span>
        </div>
      )}
    </NodeViewWrapper>
  );
};
