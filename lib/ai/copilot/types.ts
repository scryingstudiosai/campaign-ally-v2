export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // For assistant messages - what sources informed the response
  sources?: CopilotSource[];

  // For tracking token usage
  tokens?: number;
}

export interface CopilotSource {
  id: string;
  type: 'entity' | 'thread' | 'session' | 'codex' | 'relationship';
  name: string;
  entityType?: string;
  relevance: number;
  snippet?: string;
}

export interface CopilotConversation {
  id: string;
  campaignId: string;
  title: string;
  messages: CopilotMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotRequest {
  campaignId: string;
  message: string;
  conversationHistory?: CopilotMessage[];
  includeEntityIds?: string[];
}

export interface CopilotResponse {
  message: CopilotMessage;
  sources: CopilotSource[];
  suggestedFollowUps?: string[];
}
