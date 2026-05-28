import type { ChatRequest, ChatResponse } from '../types/chat.types';

const API_BASE_URL = 'http://localhost:8000/api';

export const chatApi = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  },

  async getHistory(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/chat/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to get history');
    }

    return response.json();
  },

  async clearHistory(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/chat/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to clear history');
    }

    return response.json();
  },
};
