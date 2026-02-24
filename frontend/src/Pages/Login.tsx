import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthInput from '../Common/Components/AuthInput';
import AuthButton from '../Common/Components/AuthButton';
import { useAuth } from '../Context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return false;
    }
    const re = /^\S+@\S+\.\S+$/;
    if (!re.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Handle login in context
      login(data.token, data.user, data.orgs || []);

      // Redirection logic based on requirements
      const { role } = data.user;

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'organization_admin') {
        navigate('/org-admin');
      } else if (role === 'organization_staff') {
        navigate('/staff');
      } else if (role === 'user') {
        navigate('/org-picker');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#f3f4ff]">
      <div className="w-full max-w-md px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 mx-auto">

          <h2 className="text-2xl font-bold mb-2 text-[#2D2A8C]">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <AuthInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

            <div className="flex items-center justify-between mt-4">
              <AuthButton type="submit">{loading ? 'Signing in...' : 'Sign in'}</AuthButton>

              <div className="flex flex-col items-end">
                <button type="button" onClick={() => navigate('/register')} className="text-sm text-indigo-600 hover:underline">Create account</button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400">By signing in you agree to our terms and privacy policy.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
