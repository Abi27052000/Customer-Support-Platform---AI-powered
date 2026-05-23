import Vapi from '@vapi-ai/web';
import type { AssistantOverrides } from '@vapi-ai/web/dist/api';

const VAPI_PUBLIC_KEY = '6d21de06-93a1-4e9f-ba94-d461b251e5c2';
const ASSISTANT_ID = '02cd2642-9854-4cf3-8760-27b2b0dff305';
const VAPI_TOOL_SERVER_URL =
  import.meta.env.VITE_VAPI_TOOL_SERVER_URL || 'http://localhost:8000/vapi/webhook';

const buildOrganizationRagOverrides = (organizationId: string): AssistantOverrides => ({
  variableValues: {
    organizationId,
    organization_id: organizationId,
  },
  'tools:append': [
    {
      type: 'function',
      async: false,
      server: {
        url: VAPI_TOOL_SERVER_URL,
      },
      function: {
        name: 'search_organization_knowledge',
        description:
          'Search the current organization knowledge base before answering questions about company policies, services, pricing, support, documents, or organization-specific details.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: "The customer's exact question or the information they need.",
            },
            organization_id: {
              type: 'string',
              description: `The current organization ID. Use exactly this value: ${organizationId}`,
            },
          },
          required: ['query', 'organization_id'],
        },
      },
      messages: [
        {
          type: 'request-start',
          content: 'Let me check the organization knowledge base.',
        },
        {
          type: 'request-failed',
          content: 'I could not reach the knowledge base right now.',
        },
      ],
    },
  ],
});

class VapiService {
  private vapi: Vapi;

  constructor() {
    this.vapi = new Vapi(VAPI_PUBLIC_KEY);
  }

  getVapi() {
    return this.vapi;
  }

  startCall(organizationId: string) {
    console.log('[Vapi] Starting organization RAG voice call', {
      assistantId: ASSISTANT_ID,
      organizationId,
      toolServerUrl: VAPI_TOOL_SERVER_URL,
    });

    return this.vapi.start(ASSISTANT_ID, buildOrganizationRagOverrides(organizationId));
  }

  stopCall() {
    return this.vapi.stop();
  }

  isMuted() {
    return this.vapi.isMuted();
  }

  setMuted(muted: boolean) {
    return this.vapi.setMuted(muted);
  }

  send(message: any) {
    return this.vapi.send(message);
  }
}

export const vapiService = new VapiService();
