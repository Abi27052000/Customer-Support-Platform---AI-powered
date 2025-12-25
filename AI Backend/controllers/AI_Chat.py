import os
from typing import List, Dict
from collections import deque
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from controllers.rag import PDFProcessingController
from dotenv import load_dotenv

load_dotenv()


class ChatSession:
    """Represents a chat session with message history"""
    
    def __init__(self, session_id: str, organization_id: str, max_history: int = 10):
        self.session_id = session_id
        self.organization_id = organization_id
        self.max_history = max_history
        self.messages = deque(maxlen=max_history)  
    
    def add_message(self, role: str, content: str):
        """Add a message to history"""
        self.messages.append({"role": role, "content": content})
    
    def get_history(self) -> List[Dict]:
        """Get conversation history"""
        return list(self.messages)
    
    def clear_history(self):
        """Clear conversation history"""
        self.messages.clear()


class RAGChatController:
    """
    Controller for RAG-based chatbot with conversation memory
    """
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        os.environ["GOOGLE_API_KEY"] = self.google_api_key
        
        # Initialize Gemini LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.7,
            convert_system_message_to_human=True
        )
        
        # Initialize PDF processor for retrieval
        self.pdf_processor = PDFProcessingController()
        
        # Store active chat sessions {session_id: ChatSession}
        self.sessions: Dict[str, ChatSession] = {}
    
    def get_or_create_session(self, session_id: str, organization_id: str) -> ChatSession:
        """Get existing session or create a new one"""
        if session_id not in self.sessions:
            self.sessions[session_id] = ChatSession(session_id, organization_id)
        return self.sessions[session_id]
    
    def build_context_from_documents(self, documents: List[Dict]) -> str:
        """Build context string from retrieved documents"""
        if not documents:
            return "No relevant documents found."
        
        context_parts = []
        for i, doc in enumerate(documents, 1):
            context_parts.append(
                f"[Document {i} - Score: {doc['score']:.2f}]\n{doc['content']}"
            )
        
        return "\n\n".join(context_parts)
    
    def build_prompt(self, query: str, context: str, conversation_history: List[Dict], has_documents: bool) -> List:
        """Build the prompt with context and conversation history"""
        messages = []
        
        # Adjust system message based on whether we have relevant documents
        if has_documents and context != "No relevant documents found.":
            system_prompt = f"""You are an AI assistant specializing in Garbage Management System projects. You help users understand project documentation, timelines, features, technical implementations, and development processes related to waste management applications.

Context from project documents:
{context}

CRITICAL RULES:
1. If the user greets you (hi, hello, hey, etc.), respond warmly and introduce yourself as their project assistant
2. If the user says farewell (bye, goodbye, see you, etc.), wish them well warmly
3. For project questions, answer using ONLY the context above
4. Be natural, clear, and conversational in your responses
5. NEVER write "Sources:", "Document X", "Based on the provided documents", or any citation references
6. NEVER mention chunk numbers, scores, or document/PDF file names in your answer
7. The user will see source information separately below your message
8. If asked about features, timelines, technologies, or implementation details - provide specific information from the context
9. If the context doesn't contain the answer to a project question, politely say you don't have that information in the current project documentation"""
        else:
            system_prompt = """You are an AI assistant specializing in Garbage Management System projects. 
I help users understand waste management application projects, including features like waste classification, 
reporting, collection tracking, and real-time communication systems.

Always respond warmly to greetings (hi, hello, hey) and farewells (bye, goodbye, see you, thanks). 
If users ask questions about the project but I don't have relevant documentation loaded, 
I'll let them know that I need the project documents to provide accurate information."""
        
        messages.append(SystemMessage(content=system_prompt))
        
        # Add conversation history
        for msg in conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current query
        messages.append(HumanMessage(content=query))
        
        return messages
    
    def chat(self, session_id: str, organization_id: str, query: str, 
             top_k: int = 3, score_threshold: float = 0.4) -> Dict:
        """
        Process a chat message with RAG and conversation history
        """
        try:
            # Get or create session
            session = self.get_or_create_session(session_id, organization_id)
            
            # Retrieve relevant documents using RAG
            print(f"\n--- Retrieving relevant documents for query: {query} ---")
            retrieval_result = self.pdf_processor.retrieve_documents(
                query, organization_id, top_k, score_threshold
            )
            
            # Build context from retrieved documents
            context = self.build_context_from_documents(retrieval_result.get("documents", []))
            has_documents = len(retrieval_result.get("documents", [])) > 0
            
            # Get conversation history
            conversation_history = session.get_history()
            
            # Build prompt with context and history
            messages = self.build_prompt(query, context, conversation_history, has_documents)
            
            # Generate response using LLM
            print(f"\n--- Generating response with Gemini ---")
            response = self.llm.invoke(messages)
            ai_response = response.content.strip()
            
            lines = ai_response.split('\n')
            cleaned_lines = []
            skip_rest = False
            
            for line in lines:
                if 'sources:' in line.lower() or 'source:' in line.lower():
                    skip_rest = True
                    continue
                
                if skip_rest or '.pdf' in line.lower() or 'chunk' in line.lower():
                    continue
                    
                cleaned_lines.append(line)
            
            ai_response = '\n'.join(cleaned_lines).strip()
            
            # Add to conversation history
            session.add_message("user", query)
            session.add_message("assistant", ai_response)
            
            print(f"\n--- Response generated successfully ---")
            
            return {
                "status": "success",
                "session_id": session_id,
                "organization_id": organization_id,
                "query": query,
                "response": ai_response,
                "sources": [
                    {
                        "pdf_filename": doc["pdf_filename"],
                        "chunk_index": doc["chunk_index"],
                        "score": doc["score"]
                    }
                    for doc in retrieval_result.get("documents", [])
                ],
                "conversation_length": len(session.get_history()),
                "retrieved_documents": retrieval_result.get("total_results", 0)
            }
            
        except Exception as e:
            raise Exception(f"Error in chat: {str(e)}")
    
    def get_conversation_history(self, session_id: str) -> Dict:
        """Get conversation history for a session"""
        if session_id not in self.sessions:
            return {
                "status": "error",
                "message": "Session not found"
            }
        
        session = self.sessions[session_id]
        return {
            "status": "success",
            "session_id": session_id,
            "organization_id": session.organization_id,
            "messages": session.get_history(),
            "total_messages": len(session.get_history())
        }
    
    def clear_session(self, session_id: str) -> Dict:
        """Clear a chat session"""
        if session_id in self.sessions:
            self.sessions[session_id].clear_history()
            return {
                "status": "success",
                "message": f"Session {session_id} cleared"
            }
        return {
            "status": "error",
            "message": "Session not found"
        }
    
    def delete_session(self, session_id: str) -> Dict:
        """Delete a chat session completely"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return {
                "status": "success",
                "message": f"Session {session_id} deleted"
            }
        return {
            "status": "error",
            "message": "Session not found"
        }
