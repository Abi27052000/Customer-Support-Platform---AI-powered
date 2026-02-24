export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Source {
  pdf_filename: string;
  chunk_index: number;
  score: number;
}

export interface ChatResponse {
  status: string;
  session_id: string;
  organization_id: string;
  query: string;
  response: string;
  sources: Source[];
  conversation_length: number;
  retrieved_documents: number;
}

export interface ChatRequest {
  session_id: string;
  organization_id: string;
  query: string;
  top_k?: number;
  score_threshold?: number;
}
