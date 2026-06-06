import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import ChatInterface from '../../../Components/AIChatComponents/ChatInterface';
import { useAuth } from '../../../Context/AuthContext';

export const AITextPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sessionId = useMemo(() => `session_${Date.now()}`, []);
  const organizationId = user?.orgId || '';

  if (!organizationId) {
    return (
      <div className="flex min-h-[calc(100vh-136px)] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-[#2D2A8C]">
            <Building2 size={22} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Select an organization first</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your AI support assistant needs an organization workspace so it can search the correct knowledge base.
          </p>
          <button
            onClick={() => navigate('/org-picker')}
            className="mt-5 rounded-lg bg-[#2D2A8C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#242170]"
          >
            Choose Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-136px)] min-h-[640px]">
      <ChatInterface sessionId={sessionId} organizationId={organizationId} />
    </div>
  );
};
