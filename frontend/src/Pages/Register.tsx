import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthInput from '../Common/Components/AuthInput';
import AuthSelect from '../Common/Components/AuthSelect';
import AuthButton from '../Common/Components/AuthButton';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [orgId, setOrgId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = { email, password, role };
      if (role === 'organization_admin') {
        if (orgId) body.orgId = orgId; else body.orgName = orgName;
        body.adminName = adminName;
      }
      if (role === 'organization_staff') body.orgId = orgId;

      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

      // Safely read response body (may be empty on some errors)
      const text = await res.text();
      let data: Record<string, unknown> | null = null;
      try {
        data = text ? JSON.parse(text) as Record<string, unknown> : null;
      } catch (_err) {
        // non-json response (HTML or empty) — keep raw text in data
        data = { raw: text };
      }

      if (!res.ok) {
        // prefer structured message, fall back to raw text or status
        const msg = (data && ((data.message as string) || (data.error as string))) || (data as any)?.raw || `Registration failed (${res.status})`;
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        return;
      }

      // success — backend may or may not return JSON; if data exists and contains message, you can show it
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#f3f4ff]">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6 text-[#2D2A8C]">Create an account</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <AuthInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <AuthSelect label="Role" value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="organization_staff">Organization Staff</option>
            <option value="organization_admin">Organization Admin</option>
          </AuthSelect>

          {role === 'organization_admin' && (
            <div className="grid grid-cols-2 gap-4">
              <AuthInput label="Admin Name" value={adminName} onChange={e => setAdminName(e.target.value)} required />
              <AuthInput label="Organization Name (if creating new org)" value={orgName} onChange={e => setOrgName(e.target.value)} />
              <AuthInput label="Organization ID (if joining existing)" value={orgId} onChange={e => setOrgId(e.target.value)} />
            </div>
          )}

          {role === 'organization_staff' && (
            <AuthInput label="Organization ID" value={orgId} onChange={e => setOrgId(e.target.value)} required />
          )}

          {error && <div className="text-sm text-red-600 my-4">{error}</div>}

          <div className="flex items-center justify-between mt-6">
            <AuthButton type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</AuthButton>
            <button type="button" className="text-sm text-gray-600" onClick={() => navigate('/login')}>Already have an account? Login</button>
          </div>
        </form>
      </div>
    </div>
  );
}
