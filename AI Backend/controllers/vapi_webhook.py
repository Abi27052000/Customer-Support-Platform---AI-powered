from fastapi import Request
from typing import Dict, Any
import logging
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from controllers.rag import PDFProcessingController

logger = logging.getLogger(__name__)

class VapiWebhookController:
    """Controller to handle Vapi webhook events"""

    def __init__(self):
        logger.setLevel(logging.INFO)
        logger.info("Initializing VapiWebhookController...")
        print("[Vapi RAG] Initializing VapiWebhookController...")
        self.pdf_processor = PDFProcessingController()
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if self.google_api_key:
            os.environ["GOOGLE_API_KEY"] = self.google_api_key
            logger.info("GOOGLE_API_KEY loaded for Vapi RAG answer generation")
            print("[Vapi RAG] GOOGLE_API_KEY loaded")
        else:
            logger.warning("GOOGLE_API_KEY is missing; Vapi RAG answer generation may fail")
            print("[Vapi RAG] WARNING: GOOGLE_API_KEY is missing")

        logger.info(
            "Pinecone config for Vapi RAG: index=%s host=%s embedding_model=%s dimension=%s",
            self.pdf_processor.pinecone_index_name,
            self.pdf_processor.pinecone_host,
            self.pdf_processor.embedding_model,
            self.pdf_processor.embedding_dimension,
        )
        print(
            "[Vapi RAG] Pinecone config: "
            f"index={self.pdf_processor.pinecone_index_name}, "
            f"host={self.pdf_processor.pinecone_host}, "
            f"embedding_model={self.pdf_processor.embedding_model}, "
            f"dimension={self.pdf_processor.embedding_dimension}"
        )

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            temperature=0.3,
            convert_system_message_to_human=True
        )
        logger.info("VapiWebhookController initialized successfully")
        print("[Vapi RAG] VapiWebhookController initialized successfully")
    
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
            
            logger.info("=" * 80)
            logger.info(f"Received Vapi webhook: {message_type}")
            logger.info(
                "Webhook call id=%s assistant id=%s",
                message.get('call', {}).get('id'),
                message.get('assistant', {}).get('id'),
            )
            print("=" * 80)
            print(f"[Vapi RAG] Webhook received: type={message_type}")
            print(
                "[Vapi RAG] Webhook call info: "
                f"call_id={message.get('call', {}).get('id')}, "
                f"assistant_id={message.get('assistant', {}).get('id')}"
            )
            print(f"[Vapi RAG] Message keys: {list(message.keys())}")
            
            # Handle different message types
            if message_type == 'status-update':
                return await self._handle_status_update(message)
            elif message_type == 'transcript':
                return await self._handle_transcript(message)
            elif message_type == 'tool-calls':
                return await self._handle_tool_calls(message)
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
    
    async def _handle_tool_calls(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle server-side Vapi tool calls and return results for each call."""
        tool_calls = message.get('toolCallList') or message.get('toolCalls') or []
        if not tool_calls and message.get('toolWithToolCallList'):
            tool_calls = [
                {
                    "id": item.get("toolCall", {}).get("id"),
                    "name": (
                        item.get("name")
                        or item.get("toolCall", {}).get("name")
                        or item.get("toolCall", {}).get("function", {}).get("name")
                    ),
                    "parameters": item.get("toolCall", {}).get("parameters")
                    or item.get("toolCall", {}).get("arguments")
                    or item.get("toolCall", {}).get("function", {}).get("arguments")
                    or {},
                }
                for item in message.get('toolWithToolCallList', [])
            ]
        logger.info(f"Received {len(tool_calls)} Vapi tool call(s)")
        print(f"[Vapi RAG] Received {len(tool_calls)} Vapi tool call(s)")

        results = []
        for tool_call in tool_calls:
            tool_call_id = self._extract_tool_call_id(tool_call)
            tool_name = self._extract_tool_name(tool_call)
            parameters = self._extract_tool_parameters(tool_call)

            logger.info(f"Tool call: {tool_name} ({tool_call_id}) params={parameters}")
            print(
                "[Vapi RAG] Tool call: "
                f"id={tool_call_id}, name={tool_name}, parameters={parameters}"
            )
            if not tool_name or not parameters:
                print("[Vapi RAG] Raw tool call payload:")
                print(json.dumps(tool_call, indent=2, default=str))

            if tool_name == 'search_organization_knowledge':
                result = await self._search_organization_knowledge(parameters, message)
            else:
                result = f"Unknown tool: {tool_name}"

            logger.info(
                "Tool call result prepared: id=%s name=%s result_preview=%s",
                tool_call_id,
                tool_name,
                result[:300],
            )
            print(
                "[Vapi RAG] Tool call result prepared: "
                f"id={tool_call_id}, name={tool_name}, result_preview={result[:300]}"
            )

            results.append({
                "toolCallId": tool_call_id,
                "result": result,
            })

        print(f"[Vapi RAG] Returning tool results: {results}")
        return {"results": results}

    async def _handle_function_call(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle function calls from the assistant"""
        function_call = message.get('functionCall') or message.get('function_call') or {}
        function_name = function_call.get('name')
        parameters = function_call.get('parameters') or function_call.get('arguments') or {}
        if isinstance(parameters, str):
            parameters = self._extract_tool_parameters({"arguments": parameters})
        
        logger.info(f"Function call: {function_name} with params: {parameters}")
        print(f"[Vapi RAG] Legacy function call: name={function_name}, parameters={parameters}")
        
        # Handle specific functions
        if function_name == 'lookup_order':
            return await self._lookup_order(parameters)
        elif function_name == 'get_account_info':
            return await self._get_account_info(parameters)
        elif function_name == 'create_ticket':
            return await self._create_ticket(parameters)
        elif function_name == 'search_organization_knowledge':
            result = await self._search_organization_knowledge(parameters, message)
            return {"result": result}
        else:
            logger.warning(f"Unknown function: {function_name}")
            return {"error": f"Unknown function: {function_name}"}

    def _extract_tool_call_id(self, tool_call: Dict[str, Any]) -> str:
        return str(
            tool_call.get('id')
            or tool_call.get('toolCallId')
            or tool_call.get('tool_call_id')
            or tool_call.get('functionCall', {}).get('id')
            or ''
        )

    def _extract_tool_name(self, tool_call: Dict[str, Any]) -> str:
        return str(
            tool_call.get('name')
            or tool_call.get('function', {}).get('name')
            or tool_call.get('functionCall', {}).get('name')
            or tool_call.get('function_call', {}).get('name')
            or ''
        )

    def _extract_tool_parameters(self, tool_call: Dict[str, Any]) -> Dict[str, Any]:
        """Support Vapi payload variants: parameters, arguments object, or JSON arguments."""
        parameters = (
            tool_call.get('parameters')
            or tool_call.get('arguments')
            or tool_call.get('function', {}).get('arguments')
            or tool_call.get('functionCall', {}).get('parameters')
            or tool_call.get('functionCall', {}).get('arguments')
            or tool_call.get('function_call', {}).get('parameters')
            or tool_call.get('function_call', {}).get('arguments')
            or {}
        )

        if isinstance(parameters, str):
            try:
                parsed = json.loads(parameters)
                return parsed if isinstance(parsed, dict) else {}
            except Exception:
                return {}

        return parameters if isinstance(parameters, dict) else {}

    def _find_nested_value(self, value: Any, keys: set[str]) -> Any:
        if isinstance(value, dict):
            for key, nested_value in value.items():
                if key in keys and nested_value:
                    return nested_value

                found = self._find_nested_value(nested_value, keys)
                if found:
                    return found

        if isinstance(value, list):
            for item in value:
                found = self._find_nested_value(item, keys)
                if found:
                    return found

        return None

    def _extract_organization_id(self, parameters: Dict[str, Any], message: Dict[str, Any]) -> str:
        org_id = (
            parameters.get('organization_id')
            or parameters.get('organizationId')
            or parameters.get('orgId')
        )
        if org_id:
            return str(org_id).strip()

        nested_org_id = self._find_nested_value(
            message,
            {'organization_id', 'organizationId', 'orgId'}
        )
        return str(nested_org_id).strip() if nested_org_id else ""

    def _format_context(self, documents: list[Dict[str, Any]]) -> str:
        context_parts = []
        for index, doc in enumerate(documents, 1):
            context_parts.append(
                f"Document {index}: {doc.get('content', '')}\n"
                f"Source: {doc.get('pdf_filename', 'Unknown')} chunk {doc.get('chunk_index', 0)}"
            )
        return "\n\n".join(context_parts)

    def _build_voice_answer(self, query: str, documents: list[Dict[str, Any]]) -> str:
        if not documents:
            logger.warning("No Pinecone documents found for Vapi RAG answer")
            print("[Vapi RAG] No Pinecone documents found for this query")
            return (
                "I could not find enough information in this organization's knowledge base "
                "to answer that accurately. Please contact the support team for more help."
            )

        context = self._format_context(documents)
        logger.info(
            "Generating voice answer with Gemini from %s retrieved document chunk(s)",
            len(documents),
        )
        print(f"[Vapi RAG] Generating voice answer from {len(documents)} document chunk(s)")
        prompt = [
            SystemMessage(
                content="""You are a voice customer support assistant.
Answer using only the provided organization knowledge base context.
Keep the response natural, concise, and easy to say aloud.
Do not mention document numbers, chunk numbers, filenames, scores, Pinecone, or sources.
If the context is not enough, say that the knowledge base does not contain enough information."""
            ),
            HumanMessage(
                content=f"""Customer question:
{query}

Organization knowledge base context:
{context}"""
            ),
        ]

        response = self.llm.invoke(prompt)
        answer = response.content.strip()
        logger.info("Generated Vapi RAG answer preview: %s", answer[:500])
        print(f"[Vapi RAG] Generated answer preview: {answer[:500]}")
        return answer

    async def _search_organization_knowledge(
        self,
        parameters: Dict[str, Any],
        message: Dict[str, Any]
    ) -> str:
        """Search org-specific Pinecone documents and return a voice-friendly answer."""
        query = str(parameters.get('query') or parameters.get('question') or '').strip()
        organization_id = self._extract_organization_id(parameters, message)

        if not query:
            print("[Vapi RAG] Missing query parameter in tool call")
            return "I need the customer's question before I can search the organization knowledge base."

        if not organization_id:
            print("[Vapi RAG] Missing organization_id in tool call and webhook payload")
            return "I cannot access the organization knowledge base because the organization ID is missing."

        logger.info(
            f"Searching organization knowledge base: org_id={organization_id}, query={query}"
        )
        logger.info("Expected Pinecone namespace: org_%s", organization_id)
        print("[Vapi RAG] Starting Pinecone search")
        print(f"[Vapi RAG] organization_id={organization_id}")
        print(f"[Vapi RAG] query={query}")
        print(f"[Vapi RAG] expected_namespace=org_{organization_id}")

        try:
            retrieval_result = self.pdf_processor.retrieve_documents(
                query=query,
                organization_id=organization_id,
                top_k=3,
                score_threshold=0.4
            )
            documents = retrieval_result.get('documents', [])
            logger.info(
                f"RAG search complete: namespace={retrieval_result.get('namespace')}, "
                f"documents={len(documents)}"
            )
            print(
                "[Vapi RAG] Pinecone search complete: "
                f"namespace={retrieval_result.get('namespace')}, "
                f"documents={len(documents)}"
            )
            for index, doc in enumerate(documents, 1):
                logger.info(
                    "Retrieved doc %s: score=%s pdf=%s chunk=%s content_preview=%s",
                    index,
                    doc.get('score'),
                    doc.get('pdf_filename'),
                    doc.get('chunk_index'),
                    doc.get('content', '')[:300].replace('\n', ' '),
                )
                print(
                    f"[Vapi RAG] Retrieved doc {index}: "
                    f"score={doc.get('score')}, "
                    f"pdf={doc.get('pdf_filename')}, "
                    f"chunk={doc.get('chunk_index')}, "
                    f"content_preview={doc.get('content', '')[:300].replace(chr(10), ' ')}"
                )
            return self._build_voice_answer(query, documents)
        except Exception as e:
            logger.error(f"Organization knowledge search failed: {str(e)}", exc_info=True)
            print(f"[Vapi RAG] ERROR: Organization knowledge search failed: {str(e)}")
            return "I could not reach the organization knowledge base right now. Please try again later."
    
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
