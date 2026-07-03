export type RequestStatus = 'Open' | 'Closed' | 'Resolved';

export interface SupportUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface SupportStaff {
  _id: string;
  name?: string;
  email?: string;
}

export interface StatusHistoryItem {
  status: string;
  changedAt?: string;
  note?: string;
}

export interface SupportRequest {
  _id: string;
  orgId: string;
  userId: string | SupportUser;
  title: string;
  description?: string;
  conversationSummary?: string;
  status: RequestStatus;
  assignedTo?: string | SupportStaff | null;
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportRequestInput {
  orgId?: string;
  title: string;
  description?: string;
  conversationSummary?: string;
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

export const requestApi = {
  async listRequests(): Promise<SupportRequest[]> {
    const response = await fetch('/api/requests', {
      headers: getJsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to load tickets'));
    }

    const data = await response.json();
    return data.requests || [];
  },

  async createRequest(input: CreateSupportRequestInput): Promise<SupportRequest> {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to create ticket'));
    }

    const data = await response.json();
    return data.request;
  },

  async closeRequest(id: string, note?: string, closedByStaffId?: string): Promise<SupportRequest> {
    const response = await fetch(`/api/requests/${id}/close`, {
      method: 'PUT',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({ note, closedByStaffId }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to close ticket'));
    }

    const data = await response.json();
    return data.request;
  },

  async resolveRequest(id: string, note?: string, resolvedByStaffId?: string): Promise<SupportRequest> {
    const response = await fetch(`/api/requests/${id}/resolve`, {
      method: 'PUT',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({ note, resolvedByStaffId }),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to resolve ticket'));
    }

    const data = await response.json();
    return data.request;
  },
};
