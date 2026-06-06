export interface StaffPerformanceSummary {
  totalStaff: number;
  totalTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
  averageRating: number | null;
  averageScore: number;
}

export interface StaffPerformanceItem {
  staffId: string;
  name: string;
  email: string;
  tickets: {
    assignedCount: number;
    resolvedCount: number;
    unresolvedCount: number;
    reopenedCount: number;
    averageResolutionMinutes: number | null;
    averageResolutionLabel: string;
  };
  chats: {
    attributedCount: number;
    resolvedCount: number;
    unresolvedCount: number;
    transcriptSummaries: string[];
  };
  ratings: {
    averageRating: number | null;
    count: number;
    recentComments: string[];
  };
  evaluation: {
    overallScore: number;
    qualityScore: number;
    speedScore: number;
    reliabilityScore: number;
    customerSatisfactionScore: number;
    strengths: string[];
    coachingTips: string[];
    riskFlags: string[];
    summary: string;
  };
}

export interface StaffPerformanceResponse {
  dateRange: { from: string; to: string };
  summary: StaffPerformanceSummary;
  staffPerformance: StaffPerformanceItem[];
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseError = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({ message: fallback }));
  return error.message || error.detail || fallback;
};

export const staffPerformanceApi = {
  async getReport(): Promise<StaffPerformanceResponse> {
    const response = await fetch('/api/org-admin/staff-performance', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to load staff performance'));
    }

    return response.json();
  },
};
