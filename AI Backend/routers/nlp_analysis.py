from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from controllers.nlp_analysis import LocalNLPAnalysisController

router = APIRouter(
    prefix="/api/pdf/analysis",
    tags=["nlp-analysis"]
)

controller = LocalNLPAnalysisController()

@router.post("/analyze")
async def analyze_pdf(
    pdf_file: UploadFile = File(...),
):
    """
    Analysis-only endpoint. Does NOT store in Pinecone.
    """
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")
    
    try:
        result = await controller.analyze(pdf_file)
        if result["status"] == "error":
            # We still return 200 with is_valid: false for graceful handling, 
            # or 400 if it's a real failure. Let's return 400 for rejection.
            raise HTTPException(status_code=400, detail=result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-fixed")
async def process_fixed_text(
    text: str = Form(...),
    organization_id: str = Form(...),
    filename: str = Form(...)
):
    """
    Store user-fixed/cleaned text in Pinecone.
    """
    try:
        result = await controller.process_and_store(text, organization_id, filename)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clean-analyze")
async def clean_and_analyze_pdf(
    pdf_file: UploadFile = File(...),
    organization_id: str = Form(...)
):
    """
    Efficient, user-friendly PDF analysis using local NLP.
    - Cleans unorganized text.
    - Verifies policy content.
    - Identifies ambiguities and suggests improvements.
    - Stores locally embedded vectors in Pinecone.
    """
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")
    
    try:
        result = await controller.analyze_and_process(pdf_file, organization_id)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
