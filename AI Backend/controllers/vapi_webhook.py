from fastapi import Request
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class VapiWebhookController:
    """Controller to handle Vapi webhook events"""
    
    async def handle_webhook(self, request: Request) -> Dict[str, Any]:
        """
        Handle incoming webhook from Vapi
        
        Args:
            request: FastAPI Request object
            
        Returns:
            Dict with response data
        """
        try:
            # Parse webhook payload
            payload = await request.json()
            message = payload.get('message', {})
            message_type = message.get('type')
            
            logger.info(f"Received Vapi webhook: {message_type}")
            
            # Handle different message types
            if message_type == 'status-update':
                return await self._handle_status_update(message)
            elif message_type == 'transcript':
                return await self._handle_transcript(message)
            elif message_type == 'function-call':
                return await self._handle_function_call(message)
            elif message_type == 'conversation-update':
                return await self._handle_conversation_update(message)
            elif message_type == 'hang':
                return await self._handle_hang(message)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                return {"received": True}
                
        except Exception as e:
            logger.error(f"Error handling webhook: {str(e)}", exc_info=True)
            return {"error": str(e)}
    
    async def _handle_status_update(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call status updates"""
        call = message.get('call', {})
        call_id = call.get('id')
        status = call.get('status')
        
        logger.info(f"Call {call_id} status: {status}")
        
        # store call status in database here
        #  await db.update_call_status(call_id, status)
        
        return {"received": True}
    
    async def _handle_transcript(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle transcript messages"""
        role = message.get('role')
        transcript = message.get('transcript')
        transcript_type = message.get('transcriptType')
        
        logger.info(f"{role} ({transcript_type}): {transcript}")
        
        # store transcripts in database here
        #  await db.save_transcript(call_id, role, transcript, transcript_type)
        
        return {"received": True}
    
    async def _handle_function_call(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle function calls from the assistant"""
        function_call = message.get('functionCall', {})
        function_name = function_call.get('name')
        parameters = function_call.get('parameters', {})
        
        logger.info(f"Function call: {function_name} with params: {parameters}")
        
        # Handle specific functions
        if function_name == 'lookup_order':
            return await self._lookup_order(parameters)
        elif function_name == 'get_account_info':
            return await self._get_account_info(parameters)
        elif function_name == 'create_ticket':
            return await self._create_ticket(parameters)
        else:
            logger.warning(f"Unknown function: {function_name}")
            return {"error": f"Unknown function: {function_name}"}
    
    async def _handle_conversation_update(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle conversation updates"""
        conversation = message.get('conversation', [])
        logger.info(f"Conversation updated with {len(conversation)} messages")
        
        #  process the full conversation history here
        #  await db.save_conversation(call_id, conversation)
        
        return {"received": True}
    
    async def _handle_hang(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call hang up"""
        logger.info("Call ended (hang)")
        
        # Cleanup or final processing
        # Example: await db.mark_call_ended(call_id)
        
        return {"received": True}
    
    # Function call handlers
    async def _lookup_order(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Look up order information
        This is a sample implementation - replace with actual logic
        """
        order_id = parameters.get('orderId')
        
        # Mock order lookup - replace with actual database query
        order_data = {
            "orderId": order_id,
            "status": "shipped",
            "trackingNumber": "TRK123456789",
            "estimatedDelivery": "2025-12-28"
        }
        
        return {"result": order_data}
    
    async def _get_account_info(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get account information
        This is a sample implementation - replace with actual logic
        """
        account_id = parameters.get('accountId')
        
        # Mock account lookup - replace with actual database query
        account_data = {
            "accountId": account_id,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "subscriptionType": "Premium",
            "status": "active"
        }
        
        return {"result": account_data}
    
    async def _create_ticket(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create support ticket
        This is a sample implementation - replace with actual logic
        """
        issue = parameters.get('issue')
        priority = parameters.get('priority', 'medium')
        
        # Mock ticket creation - replace with actual database insert
        ticket_data = {
            "ticketId": "TKT-12345",
            "issue": issue,
            "priority": priority,
            "status": "open",
            "createdAt": "2025-12-25T12:00:00Z"
        }
        
        return {"result": ticket_data}
