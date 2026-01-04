'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Send,
  Loader2,
  User,
  Bot,
  Sparkles,
  FileText,
  ChevronDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Source {
  id: string;
  type: string;
  name: string;
  entityType?: string;
  relevance: number;
  snippet?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface CopilotChatProps {
  campaignId: string;
  campaignName?: string;
}

export function CopilotChat({ campaignId, campaignName }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [showSources, setShowSources] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSuggestedFollowUps([]);
    setLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          message: messageText,
          conversationHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestedFollowUps(data.suggestedFollowUps || []);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestedFollowUps([]);
  };

  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 flex flex-col ${
        isExpanded ? 'fixed inset-4 z-50' : 'h-[600px]'
      }`}
    >
      {/* Header */}
      <CardHeader className="border-b border-zinc-800 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Ally
            {campaignName && (
              <span className="text-sm text-zinc-500 font-normal">— {campaignName}</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Brain className="h-12 w-12 text-purple-400/50 mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">Campaign Ally</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">
              Ask me anything about your campaign — NPCs, factions, plot threads, or &quot;what
              if&quot; scenarios.
            </p>
            <div className="grid gap-2 w-full max-w-sm">
              {[
                'Who might betray the party?',
                'What do the main factions want?',
                'What happens if they ignore the threat?',
                'Suggest a plot twist',
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 justify-start"
                  onClick={() => sendMessage(suggestion)}
                >
                  <Sparkles className="h-3 w-3 mr-2 text-purple-400" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-400" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-teal-600 rounded-2xl rounded-tr-sm'
                      : 'bg-zinc-800 rounded-2xl rounded-tl-sm'
                  } px-4 py-2`}
                >
                  <p className="text-sm text-zinc-100 whitespace-pre-wrap">{message.content}</p>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <button
                        onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                        className="text-xs text-zinc-400 hover:text-zinc-300 flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        {message.sources.length} sources
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${
                            showSources === message.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {showSources === message.id && (
                        <div className="mt-2 space-y-1">
                          {message.sources.slice(0, 5).map((source, i) => (
                            <div key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {source.entityType || source.type}
                              </Badge>
                              <span className="truncate">{source.name}</span>
                              <span className="text-zinc-600">
                                ({Math.round(source.relevance * 100)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggested Follow-ups */}
      {suggestedFollowUps.length > 0 && !loading && (
        <div className="px-4 py-2 border-t border-zinc-800">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestedFollowUps.map((suggestion, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200 whitespace-nowrap flex-shrink-0"
                onClick={() => sendMessage(suggestion)}
              >
                <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your campaign..."
            className="bg-zinc-800 border-zinc-700 flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
