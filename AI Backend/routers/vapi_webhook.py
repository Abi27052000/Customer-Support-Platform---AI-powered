from fastapi import APIRouter, Request
from controllers.vapi_webhook import VapiWebhookController

router = APIRouter(
    prefix="/vapi",
    tags=["vapi"]
)

vapi_controller = VapiWebhookController()

@router.post("/webhook")
async def vapi_webhook(request: Request):
    """
    Endpoint to receive webhooks from Vapi
    
    This endpoint handles all webhook events from Vapi including:
    - status-update: Call status changes
    - transcript: Real-time transcriptions
    - function-call: Function calls from the assistant
    - conversation-update: Full conversation updates
    - hang: Call termination
    """
    return await vapi_controller.handle_webhook(request)

@router.get("/health")
async def vapi_health():
    """Health check endpoint for Vapi integration"""
    return {
        "status": "healthy",
        "service": "vapi-webhook",
        "message": "Vapi webhook service is running"
    }
