'use client';

import { useState, useMemo } from 'react';
import { Dice6, Hammer, Eye, MessageSquare } from 'lucide-react';

type InputMode = 'narrative' | 'mechanic' | 'creative' | 'secret';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, mode: InputMode) => void;
  placeholder?: string;
}

interface CommandItemProps {
  cmd: string;
  desc: string;
  onClick?: () => void;
}

function CommandItem({ cmd, desc, onClick }: CommandItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-700/50 cursor-pointer"
    >
      <span className="font-mono text-sm text-arcane">{cmd}</span>
      <span className="text-sm text-slate-400">{desc}</span>
    </div>
  );
}

export function SmartInput({ value, onChange, onSubmit, placeholder }: SmartInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Detect input mode based on command prefix
  const mode = useMemo((): InputMode => {
    if (value.startsWith('/roll') || value.startsWith('/check') || value.startsWith('/save')) {
      return 'mechanic';
    }
    if (value.startsWith('/forge') || value.startsWith('/generate')) {
      return 'creative';
    }
    if (value.startsWith('/whisper') || value.startsWith('/secret')) {
      return 'secret';
    }
    return 'narrative';
  }, [value]);

  // Show command popup when typing just "/"
  const shouldShowCommands = value === '/' && isFocused;

  // Get mode-specific styling
  const modeStyles = {
    narrative: {
      border: 'border-slate-600',
      ring: '',
      icon: null,
    },
    mechanic: {
      border: 'border-arcane',
      ring: 'ring-2 ring-arcane/20 shadow-glow-arcane',
      icon: <Dice6 className="w-5 h-5 text-arcane" />,
    },
    creative: {
      border: 'border-gold',
      ring: 'ring-2 ring-gold/20 shadow-glow-gold',
      icon: <Hammer className="w-5 h-5 text-gold" />,
    },
    secret: {
      border: 'border-purple',
      ring: 'ring-2 ring-purple/20 shadow-glow-purple',
      icon: <Eye className="w-5 h-5 text-purple" />,
    },
  };

  const currentStyle = modeStyles[mode];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSubmit(value, mode);
    }
  };

  const handleCommandClick = (cmd: string) => {
    onChange(cmd + ' ');
  };

  return (
    <div className="relative">
      {/* Command Popup */}
      {shouldShowCommands && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <CommandItem
            cmd="/roll"
            desc="Roll dice (e.g., /roll 1d20+5)"
            onClick={() => handleCommandClick('/roll')}
          />
          <CommandItem
            cmd="/note"
            desc="Add a narrative note"
            onClick={() => handleCommandClick('/note')}
          />
          <CommandItem
            cmd="/forge"
            desc="Generate content with AI"
            onClick={() => handleCommandClick('/forge')}
          />
          <CommandItem
            cmd="/whisper"
            desc="Secret DM note (hidden)"
            onClick={() => handleCommandClick('/whisper')}
          />
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder || "Type a note or /command..."}
          className={`
            w-full px-4 py-3 pr-12
            bg-slate-800 rounded-lg
            text-slate-200 placeholder-slate-500
            border-2 transition-all duration-200
            ${currentStyle.border}
            ${currentStyle.ring}
            focus:outline-none
          `}
        />

        {/* Context Icon */}
        {currentStyle.icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {currentStyle.icon}
          </div>
        )}
      </div>
    </div>
  );
}
