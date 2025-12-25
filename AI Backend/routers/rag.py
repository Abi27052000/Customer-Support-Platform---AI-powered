from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from controllers.rag import PDFProcessingController

router = APIRouter(
    prefix="/api/pdf",
    tags=["pdf"]
)

controller = PDFProcessingController()


class QueryRequest(BaseModel):
    query: str = Field(..., description="Search query to find relevant documents")
    organization_id: str = Field(..., description="Organization ID to search within")
    top_k: int = Field(default=2, ge=1, le=10, description="Number of top results to return (default: 3)")
    score_threshold: float = Field(default=0.9, ge=0.0, le=1.0, description="Minimum similarity score (default: 0.4)")


@router.post("/upload")
async def upload_and_process_pdf(
    pdf_file: UploadFile = File(..., description="PDF file to process"),
    organization_id: str = Form(..., description="Organization ID for namespace isolation")
):
    """
    Upload a PDF file, extract text, create embeddings, and store in Pinecone
    
    - **pdf_file**: PDF file to be processed
    - **organization_id**: ID of the organization (used to create separate namespaces in Pinecone)
    
    Returns:
    - Status of the operation
    - Number of chunks processed
    - Pinecone namespace used
    """
    # Validate file type
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if not organization_id.strip():
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    try:
        result = await controller.process_pdf(pdf_file, organization_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_documents(request: QueryRequest):
    """
    Query and retrieve relevant documents from Pinecone based on similarity search
    
    - **query**: The search query text
    - **organization_id**: Organization ID (searches within org-specific namespace)
    - **top_k**: Number of results to return (1-10, default: 3)
    - **score_threshold**: Minimum similarity score (0.0-1.0, default: 0.4)
    
    Returns:
    - List of relevant documents with scores and metadata
    - Source PDF filename and chunk information
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if not request.organization_id.strip():
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    try:
        result = controller.retrieve_documents(
            request.query, 
            request.organization_id, 
            request.top_k, 
            request.score_threshold
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
