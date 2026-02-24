import React, { useState } from 'react';
import ChatInterface from '../../../Components/AIChatComponents/ChatInterface';

export const AITextPage: React.FC = () => {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [organizationId, setOrganizationId] = useState('');
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (organizationId.trim()) {
      setStarted(true);
    }
  };

  if (!started) {
    return (
      <div className="flex items-center justify-center h-full p-4 bg-linear-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI RAG Chatbot</h1>
            <p className="text-gray-600">Chat with your documents using AI</p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="orgId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Organization ID
              </label>
              <input
                id="orgId"
                type="text"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder="Enter your organization ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use the same organization ID you used when uploading PDFs
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={!organizationId.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Start Chat
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Session ID:</span>{' '}
              <span className="text-xs font-mono">{sessionId}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatInterface sessionId={sessionId} organizationId={organizationId} />
    </div>
  );
};


