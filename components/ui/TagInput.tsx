'use client'

import React, { useState, KeyboardEvent, useEffect, forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string[];
  onChange: (tags: string[]) => void;
}

const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({ className, value, onChange, disabled, placeholder, ...props }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [tags, setTags] = useState(value || []);

    useEffect(() => {
      setTags(value || []);
    }, [value]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
          const newTags = [...tags, newTag];
          setTags(newTags);
          onChange(newTags);
        }
        setInputValue('');
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
        const newTags = tags.slice(0, -1);
        setTags(newTags);
        onChange(newTags);
      }
    };

    const removeTag = (tagToRemove: string) => {
      const newTags = tags.filter(tag => tag !== tagToRemove);
      setTags(newTags);
      onChange(newTags);
    };

    return (
      <div className={cn(
        "flex flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}>
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 pl-2 pr-1 py-0.5">
            <span className="text-sm">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={disabled}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[100px]"
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

export default TagInput;