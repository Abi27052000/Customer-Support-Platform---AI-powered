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

export interface ConversationSummaryFilters {
  channel?: ConversationChannel | 'all';
  endedReason?: ConversationEndedReason | 'all';
  from?: string;
  to?: string;
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

  async listSummaries(filters: ConversationSummaryFilters = {}): Promise<ConversationSummary[]> {
    const params = new URLSearchParams();
    if (filters.channel && filters.channel !== 'all') params.set('channel', filters.channel);
    if (filters.endedReason && filters.endedReason !== 'all') params.set('endedReason', filters.endedReason);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    const query = params.toString();
    const response = await fetch(`/api/conversation-summaries${query ? `?${query}` : ''}`, {
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
