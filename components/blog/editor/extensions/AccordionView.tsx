import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';

export default ({ node, updateAttributes }: any) => {
  const { title } = node.attrs;

  return (
    <NodeViewWrapper className="accordion my-4 border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 font-bold bg-muted/50 cursor-default">
        <input
          className="bg-transparent border-none focus:outline-none w-full mr-2"
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          placeholder="アコーディオンのタイトル..."
        />
        <ChevronDown size={16} className="text-muted-foreground" />
      </div>
      <div className="p-4 border-t border-border bg-background">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};
