import React from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
}

const Callout: React.FC<CalloutProps> = ({ type = 'info', children }) => {
  const icons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
  };

  const styles = {
    info: 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100',
    warning: 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-100',
    success: 'bg-green-500/10 border-green-500 text-green-900 dark:text-green-100',
    error: 'bg-red-500/10 border-red-500 text-red-900 dark:text-red-100',
  };

  return (
    <div className={cn('flex gap-4 p-4 my-6 rounded-lg border-l-4', styles[type])}>
      <div className="shrink-0 mt-1">{icons[type]}</div>
      <div className="flex-1 prose-sm dark:prose-invert leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default Callout;
