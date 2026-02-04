'use client'

import React, { useState, KeyboardEvent, useEffect, forwardRef, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllTags } from '@/actions/blog';
import { ScrollArea } from './scroll-area';

export interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  ({ className, value, onChange, disabled, placeholder, maxTags = 10, ...props }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [tags, setTags] = useState(value || []);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setTags(value || []);
    }, [value]);

    useEffect(() => {
      const fetchTags = async () => {
        const { tags: allTags } = await getAllTags();
        setSuggestions(allTags);
      };
      fetchTags();
    }, []);

    useEffect(() => {
      if (inputValue.trim()) {
        const filtered = suggestions.filter(s => 
          s.toLowerCase().includes(inputValue.toLowerCase()) && 
          !tags.includes(s)
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      }
    }, [inputValue, suggestions, tags]);

    // クリック以外でサジェストを閉じる
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addTag = (tag: string) => {
      const newTag = tag.trim();
      if (newTag && !tags.includes(newTag)) {
        if (tags.length >= maxTags) {
          setInputValue('');
          setShowSuggestions(false);
          return;
        }
        const newTags = [...tags, newTag];
        setTags(newTags);
        onChange(newTags);
      }
      setInputValue('');
      setShowSuggestions(false);
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
        const newTags = tags.slice(0, -1);
        setTags(newTags);
        onChange(newTags);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    const removeTag = (tagToRemove: string) => {
      const newTags = tags.filter(tag => tag !== tagToRemove);
      setTags(newTags);
      onChange(newTags);
    };

    return (
      <div className="relative" ref={containerRef}>
      <div className={cn(
        "flex flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring min-h-[42px]",
        (disabled || tags.length >= maxTags) && inputValue === '' && "cursor-not-allowed",
        disabled && "opacity-50",
        className
      )}>
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 pl-2 pr-1 py-1 group/tag">
            <span className="text-sm font-medium">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-60 group-hover/tag:opacity-100 transition-opacity"
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </Badge>
        ))}
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
          disabled={disabled || (tags.length >= maxTags && inputValue === '')}
          {...props}
        />

        {maxTags && (
          <div className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground pointer-events-none">
            {tags.length} / {maxTags}
          </div>
        )}
      </div>
      
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
          <ScrollArea className="max-h-[200px]">
            <div className="p-1">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                  onClick={() => addTag(suggestion)}
                >
                  <TagIcon className="h-3 w-3 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

export default TagInput;