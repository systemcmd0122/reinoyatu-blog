import React from 'react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  children: React.ReactNode;
}

export const Timeline: React.FC<TimelineProps> = ({ children }) => {
  return (
    <div className="timeline my-12 relative before:absolute before:inset-0 before:left-[17px] before:w-0.5 before:bg-border space-y-0">
      {children}
    </div>
  );
};

interface TimelineItemProps {
  time?: string;
  children: React.ReactNode;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ time, children }) => {
  return (
    <div className="relative pl-12 pb-10 last:pb-0 group">
      <div className="absolute left-0 top-1.5 w-9 h-9 flex items-center justify-center bg-background rounded-full border-2 border-border group-hover:border-primary transition-colors z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
      {time && (
        <time className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 group-hover:text-primary transition-colors">
          {time}
        </time>
      )}
      <div className="prose dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  );
};
