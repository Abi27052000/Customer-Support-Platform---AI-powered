import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthInput from '../Common/Components/AuthInput';
import AuthButton from '../Common/Components/AuthButton';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        name,
        email,
        password,
        role: 'user'
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#f3f4ff]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-[#2D2A8C]">Create an account</h2>
        <p className="text-sm text-slate-500 mb-6">Join us to start managing your support tickets.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <AuthInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

          <div className="flex items-center justify-between mt-6">
            <AuthButton type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</AuthButton>
            <button type="button" className="text-sm text-indigo-600 hover:underline" onClick={() => navigate('/login')}>
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
