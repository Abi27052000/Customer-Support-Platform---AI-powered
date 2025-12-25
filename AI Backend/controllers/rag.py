import os
import tempfile
from typing import List
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.schema import Document
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class PDFProcessingController:
    """
    Controller for handling PDF processing, embedding generation, and Pinecone storage
    """
    
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "quickstart")
        self.pinecone_host = os.getenv("PINECONE_HOST")
        self.embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
        self.embedding_dimension = int(os.getenv("EMBEDDING_DIMENSION", "768"))
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = self.pc.Index(name=self.pinecone_index_name, host=self.pinecone_host)
        
        # Initialize embeddings with dimension parameter
        os.environ["GOOGLE_API_KEY"] = self.google_api_key
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=self.embedding_model,
            task_type="retrieval_document"
        )
    
    def extract_text_from_pdf(self, pdf_file_path: str) -> str:
        """
        Extract text content from a PDF file
        """
        try:
            reader = PdfReader(pdf_file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def split_text_into_chunks(self, text: str) -> List[Document]:
        """
        Split text into manageable chunks using RecursiveCharacterTextSplitter
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Create a Document object and split it
        documents = [Document(page_content=text)]
        chunks = text_splitter.split_documents(documents)
        
        # Print chunk information
        print("\n" + "="*80)
        print(f"TOTAL CHUNKS CREATED: {len(chunks)}")
        print("="*80)
        
        for i, chunk in enumerate(chunks):
            print(f"\n--- CHUNK {i+1} ---")
            print(f"Length: {len(chunk.page_content)} characters")
            print(f"Content:\n{chunk.page_content}")
            print("-" * 80)
        
        return chunks
    
    def generate_embeddings(self, chunks: List[Document]) -> List[List[float]]:
        """
        Generate embeddings for text chunks using Gemini
        """
        try:
            texts = [chunk.page_content for chunk in chunks]
            embeddings = self.embeddings.embed_documents(texts)
            return embeddings
        except Exception as e:
            raise Exception(f"Error generating embeddings: {str(e)}")
    
    def store_in_pinecone(self, chunks: List[Document], embeddings: List[List[float]], 
                          organization_id: str, pdf_filename: str):
        """
        Store embeddings in Pinecone with organization-based namespace
        """
        try:
            vectors = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{organization_id}_{pdf_filename}_{i}"
                metadata = {
                    "organization_id": organization_id,
                    "pdf_filename": pdf_filename,
                    "chunk_index": i,
                    "text": chunk.page_content[:1000]  # Store first 1000 chars of text
                }
                vectors.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                })
            
            # Upsert vectors to Pinecone with namespace
            namespace = f"org_{organization_id}"
            self.index.upsert(vectors=vectors, namespace=namespace)
            
            return {
                "vectors_stored": len(vectors),
                "namespace": namespace
            }
        except Exception as e:
            raise Exception(f"Error storing in Pinecone: {str(e)}")
    
    async def process_pdf(self, pdf_file, organization_id: str):
        """
        Main method to process PDF: extract text, chunk, embed, and store in Pinecone
        """
        temp_file_path = None
        try:
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                content = await pdf_file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(temp_file_path)
            
            if not text.strip():
                raise Exception("No text content found in PDF")
            
            # Split text into chunks
            chunks = self.split_text_into_chunks(text)
            
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            
            # Store in Pinecone
            storage_result = self.store_in_pinecone(
                chunks, 
                embeddings, 
                organization_id, 
                pdf_file.filename
            )
            
            return {
                "status": "success",
                "message": "PDF processed and stored successfully",
                "pdf_filename": pdf_file.filename,
                "organization_id": organization_id,
                "chunks_processed": len(chunks),
                "vectors_stored": storage_result["vectors_stored"],
                "namespace": storage_result["namespace"]
            }
            
        except Exception as e:
            raise Exception(f"Error processing PDF: {str(e)}")
        
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    def retrieve_documents(self, query: str, organization_id: str, top_k: int = 3, score_threshold: float = 0.4):
        """
        Retrieve relevant documents from Pinecone based on a query
        
        Args:
            query: The search query
            organization_id: Organization ID to search within specific namespace
            top_k: Number of top results to return
            score_threshold: Minimum similarity score threshold
        
        Returns:
            List of relevant documents with their content and scores
        """
        try:
            # Generate embedding for the query
            query_embedding = self.embeddings.embed_query(query)
            
            # Search in Pinecone with organization namespace
            namespace = f"org_{organization_id}"
            
            print(f"\n--- Searching in namespace: {namespace} ---")
            print(f"Query: {query}")
            print(f"Top K: {top_k}, Score Threshold: {score_threshold}\n")
            
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                include_metadata=True
            )
            
            # Filter by score threshold and format results
            relevant_docs = []
            for match in results['matches']:
                score = match['score']
                if score >= score_threshold:
                    relevant_docs.append({
                        "content": match['metadata'].get('text', ''),
                        "score": score,
                        "pdf_filename": match['metadata'].get('pdf_filename', 'Unknown'),
                        "chunk_index": match['metadata'].get('chunk_index', 0),
                        "organization_id": match['metadata'].get('organization_id', '')
                    })
            
            # Print results to console
            print(f"\n--- Found {len(relevant_docs)} Relevant Documents ---")
            for i, doc in enumerate(relevant_docs, 1):
                print(f"\nDocument {i}:")
                print(f"Score: {doc['score']:.4f}")
                print(f"Source: {doc['pdf_filename']} (Chunk {doc['chunk_index']})")
                print(f"Content: {doc['content'][:200]}...")
                print("-" * 80)
            
            return {
                "status": "success",
                "query": query,
                "organization_id": organization_id,
                "namespace": namespace,
                "total_results": len(relevant_docs),
                "documents": relevant_docs
            }
            
        except Exception as e:
            raise Exception(f"Error retrieving documents: {str(e)}")
