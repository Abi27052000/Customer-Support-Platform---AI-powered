interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'organization_admin' | 'organization_staff' | 'user';
    orgId?: string;
  };
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

export const accountSettingsApi = {
  async updateProfile(input: { name: string }) {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to update profile'));
    }

    return response.json() as Promise<ProfileResponse>;
  },

  async changePassword(input: { currentPassword: string; newPassword: string }) {
    const response = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to update password'));
    }
  },
};
