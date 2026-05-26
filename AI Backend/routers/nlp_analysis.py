from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from controllers.nlp_analysis import LocalNLPAnalysisController
from typing import Optional

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
    Focused AI Policy Analysis. 
    Returns: Red-flags, Risk Heatmap, and Definition consistency.
    """
    if not pdf_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")
    
    try:
        result = await controller.analyze(pdf_file)
        return result
    except Exception as e:
        print(f"Router Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-fixed")
async def process_fixed_text(
    text: str = Form(...),
    organization_id: str = Form(...),
    filename: str = Form(...)
):
    """
    Store finalized text from the Review Studio in Pinecone.
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
    Full pipeline wrapper: Analysis + Auto-Store.
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
