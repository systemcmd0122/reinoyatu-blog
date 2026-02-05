import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500',
  };

  return (
    <div className="my-8 space-y-2">
      <div className="flex justify-between items-end">
        {label && <span className="text-sm font-black uppercase tracking-wider">{label}</span>}
        <span className="text-xs font-mono font-bold text-muted-foreground">{value}%</span>
      </div>
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
        <div 
          className={cn('h-full transition-all duration-1000 ease-out', colorClasses[color])} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
