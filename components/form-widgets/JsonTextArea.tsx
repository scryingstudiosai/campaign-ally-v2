'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';

interface JsonTextAreaProps {
  label?: string;
  value: unknown;
  onChange: (value: unknown) => void;
  rows?: number;
}

export function JsonTextArea({
  label,
  value,
  onChange,
  rows = 10,
}: JsonTextAreaProps): JSX.Element {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Initialize text from value
  useEffect(() => {
    try {
      setText(JSON.stringify(value, null, 2));
      setIsValid(true);
      setError(null);
    } catch {
      setText('{}');
    }
  }, [value]);

  const handleChange = (newText: string): void => {
    setText(newText);

    try {
      const parsed = JSON.parse(newText);
      onChange(parsed);
      setIsValid(true);
      setError(null);
    } catch {
      setIsValid(false);
      setError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <div className="flex items-center gap-1">
            {isValid ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Valid JSON
              </span>
            ) : (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </span>
            )}
          </div>
        </div>
      )}

      <Textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={rows}
        className={`font-mono text-sm ${
          !isValid ? 'border-red-500 focus:border-red-500' : ''
        }`}
        placeholder="{}"
      />

      <p className="text-xs text-slate-500">
        Edit the raw JSON data. Be careful with formatting.
      </p>
    </div>
  );
}
