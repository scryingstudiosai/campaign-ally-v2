'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface StringArrayInputProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export function StringArrayInput({
  label,
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add...',
  maxItems = 20,
}: StringArrayInputProps): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  const addItem = (): void => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxItems) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const removeItem = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}

      {/* Current Items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-slate-900/50 rounded-lg min-h-[40px]">
          {value.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-slate-700 text-slate-200 pl-2 pr-1 py-1 flex items-center gap-1"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="ml-1 hover:bg-slate-600 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={value.length >= maxItems}
          className="flex-1"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!inputValue.trim() || value.length >= maxItems}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {value.length >= maxItems && (
        <p className="text-xs text-amber-400">Maximum {maxItems} items reached</p>
      )}
    </div>
  );
}
