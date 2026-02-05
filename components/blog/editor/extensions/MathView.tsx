import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sigma } from 'lucide-react';

export default ({ node, updateAttributes, selected }: any) => {
  const { latex, inline } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);

  const html = katex.renderToString(latex || '...', {
    displayMode: !inline,
    throwOnError: false,
  });

  return (
    <NodeViewWrapper 
      className={inline ? "inline-block" : "block w-full my-6"}
      data-latex={latex}
      data-inline={inline}
    >
      <Popover open={selected || isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <span
            className={`cursor-pointer transition-all rounded px-1 ${selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted'}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" side="top" align="center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sigma className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">数式の編集</span>
            </div>
            <Input
              value={latex}
              onChange={(e) => updateAttributes({ latex: e.target.value })}
              placeholder="LaTeXを入力..."
              autoFocus
              className="font-mono text-sm"
            />
            <div className="text-[10px] text-muted-foreground italic">
              {"例: E = mc^2, \\sum_{i=1}^{n} i, \\int_{a}^{b} f(x) dx"}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
};
