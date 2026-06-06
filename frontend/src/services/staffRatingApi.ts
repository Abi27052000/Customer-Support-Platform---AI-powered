export interface RateableInteraction {
  sourceType: 'ticket' | 'chat';
  sourceId: string;
  title: string;
  staff?: {
    _id: string;
    name?: string;
    email?: string;
  };
  resolvedAt: string;
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

export const staffRatingApi = {
  async listRateable(): Promise<RateableInteraction[]> {
    const response = await fetch('/api/staff-ratings/rateable', {
      headers: getJsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to load resolved interactions'));
    }

    const data = await response.json();
    return data.items || [];
  },

  async submitRating(input: {
    sourceType: 'ticket' | 'chat';
    sourceId: string;
    rating: number;
    comment?: string;
  }): Promise<void> {
    const response = await fetch('/api/staff-ratings', {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to submit rating'));
    }
  },
};
