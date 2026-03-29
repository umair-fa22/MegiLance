// @AI-HINT: Interactive tags input component for adding/removing keyword tags with keyboard support
'use client';

import React, { useState, KeyboardEvent } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

import common from './TagsInput.common.module.css';
import light from './TagsInput.light.module.css';
import dark from './TagsInput.dark.module.css';

export interface TagsInputProps {
  id: string;
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({ id, label, tags, onTagsChange, placeholder, error }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={common.container}>
      <label htmlFor={id} className={cn(common.label, themed.label)}>{label}</label>
      <div className={cn(common.input_wrapper, themed.input_wrapper, error && themed.error_border)}>
        {tags.map(tag => (
          <span key={tag} className={cn(common.tag, themed.tag)}>
            {tag}
            <button onClick={() => removeTag(tag)} className={cn(common.remove_button, themed.remove_button)} aria-label={`Remove ${tag}`}>
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(common.input, themed.input)}
        />
      </div>
      {error && <p className={cn(common.error_message, themed.error_message)}>{error}</p>}
    </div>
  );
};

export default TagsInput;
