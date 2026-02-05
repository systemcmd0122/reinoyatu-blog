import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export default ({ node }: any) => {
  const { value, label, color } = node.attrs;
  
  const colorClass = 
    color === 'success' ? 'bg-green-500' :
    color === 'warning' ? 'bg-amber-500' :
    color === 'destructive' ? 'bg-red-500' : 'bg-primary';

  return (
    <NodeViewWrapper className="progress-bar-container my-6 w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold">{label}</span>
        <span className="text-xs font-mono">{value}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </NodeViewWrapper>
  );
};
