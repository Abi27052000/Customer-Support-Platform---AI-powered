export interface LiveChatMessage {
  author?: string;
  role?: 'customer' | 'staff' | 'system' | 'unknown';
  message: string;
  sentAt?: string;
}

export interface LiveChatSession {
  _id: string;
  roomId: string;
  orgId?: string;
  customerId?: string | { _id: string; name?: string; email?: string };
  staffId?: string | { _id: string; name?: string; email?: string };
  status: 'Open' | 'Closed' | 'Resolved';
  messages: LiveChatMessage[];
  lastMessageAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const getJsonAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseError = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({ message: fallback }));
  return error.message || error.detail || fallback;
};

export const liveChatApi = {
  async getMyOpenSession(): Promise<LiveChatSession | null> {
    const response = await fetch('/api/live-chat/session', {
      headers: getJsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to load live chat session'));
    }

    const data = await response.json();
    return data.session || null;
  },

  async listStaffSessions(): Promise<LiveChatSession[]> {
    const response = await fetch('/api/staff/chat-sessions', {
      headers: getJsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to load chat sessions'));
    }

    const data = await response.json();
    return data.sessions || [];
  },

  async closeSession(roomId: string): Promise<LiveChatSession> {
    const response = await fetch(`/api/staff/chat-sessions/${encodeURIComponent(roomId)}/close`, {
      method: 'PUT',
      headers: getJsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to close chat session'));
    }

    const data = await response.json();
    return data.session;
  },
};
