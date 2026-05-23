export type ConversationChannel = 'ai_chat' | 'ai_voice';
export type ConversationEndedReason = 'ended' | 'escalated' | 'cleared';

export interface SaveConversationSummaryRequest {
  channel: ConversationChannel;
  sessionId: string;
  orgId: string;
  endedReason: ConversationEndedReason;
  conversationText: string;
}

export interface ConversationSummary {
  id: string;
  channel: ConversationChannel;
  sessionId: string;
  title: string;
  summary: string;
  status: 'Closed';
  endedReason: ConversationEndedReason;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const conversationSummaryApi = {
  async saveSummary(request: SaveConversationSummaryRequest): Promise<ConversationSummary> {
    const response = await fetch('/api/conversation-summaries', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save conversation summary' }));
      throw new Error(error.message || 'Failed to save conversation summary');
    }

    const data = await response.json();
    return data.conversationSummary;
  },

  async listSummaries(): Promise<ConversationSummary[]> {
    const response = await fetch('/api/conversation-summaries', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to load conversation summaries' }));
      throw new Error(error.message || 'Failed to load conversation summaries');
    }

    const data = await response.json();
    return data.conversationSummaries;
  },
};
