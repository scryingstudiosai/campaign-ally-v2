'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Dices, Swords, Shield, Sparkles, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { rollDice, DICE_PRESETS, DiceResult } from '@/lib/dice';

interface SmartInputProps {
  onSend: (event: {
    type: string;
    title?: string;
    description?: string;
    payload?: Record<string, unknown>;
  }) => void;
  disabled?: boolean;
}

interface SlashCommand {
  command: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: '/roll', label: 'Roll Dice', icon: Dices, description: '/roll 1d20+5' },
  { command: '/check', label: 'Skill Check', icon: Swords, description: '/check perception' },
  { command: '/save', label: 'Saving Throw', icon: Shield, description: '/save dex' },
  { command: '/forge', label: 'Quick Forge', icon: Sparkles, description: '/forge npc' },
  { command: '/note', label: 'DM Note', icon: MessageSquare, description: '/note (private)' },
];

export function SmartInput({ onSend, disabled }: SmartInputProps) {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showDicePresets, setShowDicePresets] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on input
  const filteredCommands = input.startsWith('/')
    ? SLASH_COMMANDS.filter(cmd =>
        cmd.command.startsWith(input.split(' ')[0].toLowerCase())
      )
    : [];

  useEffect(() => {
    setShowCommands(input.startsWith('/') && !input.includes(' '));
    setSelectedCommandIndex(0);
  }, [input]);

  const formatRollDescription = (result: DiceResult) => {
    const rollsStr = result.rolls.join(', ');
    let desc = `[${rollsStr}]`;
    if (result.modifier !== 0) {
      desc += ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`;
    }
    desc += ` = **${result.total}**`;
    if (result.isNat20) desc += ' 🎉 NAT 20!';
    if (result.isNat1) desc += ' 💀 NAT 1!';
    return desc;
  };

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;

    const trimmed = input.trim();

    // Handle slash commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      switch (command) {
        case '/roll':
          try {
            const result = rollDice(args || '1d20');
            onSend({
              type: 'roll',
              title: `Rolled ${result.expression}`,
              description: formatRollDescription(result),
              payload: result as unknown as Record<string, unknown>,
            });
          } catch (error) {
            onSend({
              type: 'note',
              title: 'Invalid Roll',
              description: error instanceof Error ? error.message : 'Unknown error',
            });
          }
          break;

        case '/check':
          onSend({
            type: 'skill_check',
            title: `${args || 'Ability'} Check`,
            description: `Requested ${args || 'ability'} check`,
            payload: { skill: args },
          });
          break;

        case '/save':
          onSend({
            type: 'saving_throw',
            title: `${args?.toUpperCase() || 'DEX'} Save`,
            description: `Requested ${args?.toUpperCase() || 'DEX'} saving throw`,
            payload: { stat: args },
          });
          break;

        case '/forge':
          onSend({
            type: 'custom',
            title: 'Quick Forge',
            description: `Opening forge for: ${args || 'npc'}`,
            payload: { forgeType: args || 'npc' },
          });
          break;

        case '/note':
          onSend({
            type: 'note',
            title: 'DM Note',
            description: args,
            payload: { isPrivate: true },
          });
          break;

        default:
          onSend({
            type: 'note',
            description: trimmed,
          });
      }
    } else {
      // Regular text - narrative entry
      onSend({
        type: 'narrative',
        description: trimmed,
      });
    }

    setInput('');
    setShowCommands(false);
    setShowDicePresets(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowDown' && showCommands) {
      e.preventDefault();
      setSelectedCommandIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp' && showCommands) {
      e.preventDefault();
      setSelectedCommandIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Tab' && showCommands && filteredCommands.length > 0) {
      e.preventDefault();
      setInput(filteredCommands[selectedCommandIndex].command + ' ');
      setShowCommands(false);
    }
  };

  const selectCommand = (command: string) => {
    setInput(command + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const quickRoll = (expression: string) => {
    try {
      const result = rollDice(expression);
      onSend({
        type: 'roll',
        title: `Rolled ${result.expression}`,
        description: formatRollDescription(result),
        payload: result as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.error('Roll error:', error);
    }
    setShowDicePresets(false);
  };

  return (
    <div className="relative border-t border-slate-800 bg-slate-900/50 p-3">
      {/* Slash Command Menu */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.command}
              onClick={() => selectCommand(cmd.command)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedCommandIndex
                  ? 'bg-teal-900/50 text-teal-300'
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
            >
              <cmd.icon className="w-4 h-4" />
              <div className="flex-1">
                <span className="font-medium">{cmd.label}</span>
                <span className="text-xs text-slate-500 ml-2">{cmd.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dice Presets */}
      {showDicePresets && (
        <div className="absolute bottom-full left-3 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2">
          <p className="text-xs text-slate-500 mb-2 px-1">Quick Roll</p>
          <div className="flex gap-1 flex-wrap">
            {DICE_PRESETS.map((preset) => (
              <button
                key={preset.expression}
                onClick={() => quickRoll(preset.expression)}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-teal-700 rounded transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-2">
        {/* Dice Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowDicePresets(!showDicePresets)}
          className="h-9 w-9 text-slate-400 hover:text-teal-400"
          title="Quick Roll"
        >
          <Dices className="h-5 w-5" />
        </Button>

        {/* Main Input */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or / for commands..."
            disabled={disabled}
            className="bg-slate-800 border-slate-700 pr-10 h-10"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="h-10 px-4 bg-teal-600 hover:bg-teal-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-600 mt-1">
        Type <span className="text-slate-500">/</span> for commands • <span className="text-slate-500">Enter</span> to send
      </p>
    </div>
  );
}
