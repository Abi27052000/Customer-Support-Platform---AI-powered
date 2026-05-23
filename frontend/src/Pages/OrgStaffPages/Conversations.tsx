import React, { useEffect, useState } from 'react';
import FilterBar from '../../Common/Components/FilterBar';
import ConversationItem from '../../Common/Components/ConversationItem';
import { conversationSummaryApi, type ConversationSummary } from '../../services/conversationSummaryApi';

const formatRelativeTime = (dateValue: string) => {
  const createdAt = new Date(dateValue).getTime();
  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const channelLabel = (channel: ConversationSummary['channel']) =>
  channel === 'ai_voice' ? 'AI Voice' : 'AI Chat';

const stripJsonFence = (value: string) =>
  value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const formatSummaryRecord = (conversation: ConversationSummary) => {
  const cleanedSummary = stripJsonFence(conversation.summary || '');

  if (cleanedSummary.startsWith('{') && cleanedSummary.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanedSummary) as { title?: string; summary?: string };
      return {
        title: parsed.title?.trim() || conversation.title,
        summary: parsed.summary?.trim() || cleanedSummary,
      };
    } catch {
      return {
        title: conversation.title,
        summary: cleanedSummary,
      };
    }
  }

  return {
    title: conversation.title,
    summary: cleanedSummary,
  };
};

const OrgStaffConversations: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        setLoading(true);
        const summaries = await conversationSummaryApi.listSummaries();
        setConversations(summaries);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    void loadSummaries();
  }, []);

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#2D2A8C]">Conversations</h2>
          <div className="text-sm text-gray-600">Total: {conversations.length}</div>
        </div>

        <div className="mt-4">
          <FilterBar />
        </div>

        <div className="mt-4 space-y-3">
          {loading && <div className="text-sm text-gray-500">Loading conversations...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && conversations.length === 0 && (
            <div className="text-sm text-gray-500">No saved AI conversation summaries yet.</div>
          )}
          {!loading && !error && conversations.map((conversation) => {
            const formatted = formatSummaryRecord(conversation);

            return (
              <ConversationItem
                key={conversation.id}
                convId={conversation.id}
                subject={`${formatted.title} (${channelLabel(conversation.channel)})`}
                customer={conversation.customer?.name || conversation.customer?.email || 'Customer'}
                time={formatRelativeTime(conversation.createdAt)}
                status={conversation.status}
                summary={formatted.summary}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default OrgStaffConversations;
