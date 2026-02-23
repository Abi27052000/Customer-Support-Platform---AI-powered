export interface VapiMessage {
  type: 'transcript' | 'function-call' | 'status-update' | 'conversation-update' | 'hang' | 'speech-update';
  role?: 'user' | 'assistant' | 'system';
  transcript?: string;
  transcriptType?: 'partial' | 'final';
  call?: {
    id: string;
    status: string;
  };
  functionCall?: {
    name: string;
    parameters: Record<string, any>;
  };
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

export interface CallStatus {
  isActive: boolean;
  isConnecting: boolean;
  error?: string;
}
