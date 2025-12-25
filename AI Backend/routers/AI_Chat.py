from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from controllers.AI_Chat import RAGChatController

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
)

controller = RAGChatController()


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session ID for conversation tracking")
    organization_id: str = Field(..., description="Organization ID to search documents from")
    query: str = Field(..., description="User's message/question")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of documents to retrieve (default: 3)")
    score_threshold: float = Field(default=0.4, ge=0.0, le=1.0, description="Minimum similarity score (default: 0.4)")


class SessionRequest(BaseModel):
    session_id: str = Field(..., description="Session ID to manage")


@router.post("/message")
async def send_message(request: ChatRequest):
    """
    Send a message to the RAG chatbot
    
    - **session_id**: Unique ID for this conversation (remembers last 10 messages)
    - **organization_id**: Organization ID to retrieve documents from
    - **query**: Your question or message
    - **top_k**: Number of relevant documents to retrieve (optional, default: 3)
    - **score_threshold**: Minimum relevance score (optional, default: 0.4)
    
    Returns:
    - AI response based on documents and conversation history
    - Source documents used
    - Conversation length
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if not request.session_id.strip():
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    if not request.organization_id.strip():
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    try:
        result = controller.chat(
            request.session_id,
            request.organization_id,
            request.query,
            request.top_k,
            request.score_threshold
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/history")
async def get_history(request: SessionRequest):
    """
    Get conversation history for a session
    
    - **session_id**: The session ID to retrieve history for
    
    Returns:
    - List of all messages in the conversation (last 10)
    """
    if not request.session_id.strip():
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    try:
        result = controller.get_conversation_history(request.session_id)
        if result["status"] == "error":
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear")
async def clear_history(request: SessionRequest):
    """
    Clear conversation history for a session (keeps session active)
    
    - **session_id**: The session ID to clear
    
    Returns:
    - Success message
    """
    if not request.session_id.strip():
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    try:
        result = controller.clear_session(request.session_id)
        if result["status"] == "error":
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session")
async def delete_session(request: SessionRequest):
    """
    Delete a chat session completely
    
    - **session_id**: The session ID to delete
    
    Returns:
    - Success message
    """
    if not request.session_id.strip():
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    try:
        result = controller.delete_session(request.session_id)
        if result["status"] == "error":
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
