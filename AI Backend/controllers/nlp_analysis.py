import os
import tempfile
import re
from typing import List, Dict, Any
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

class LocalNLPAnalysisController:
    """
    New controller for efficient, local PDF analysis (cleaning, verification, and ambiguity detection).
    """
    
    def __init__(self):
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "quickstart")
        self.pinecone_host = os.getenv("PINECONE_HOST")
        self.embedding_model_name = "all-MiniLM-L6-v2"  # Local efficient model
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = self.pc.Index(name=self.pinecone_index_name, host=self.pinecone_host)
        
        # Initialize Local Models
        print(f"Initializing local embedding model: {self.embedding_model_name}...")
        self.model = SentenceTransformer(self.embedding_model_name)
        
        print("Initializing local classification pipeline (distilbert-base-uncased-mnli)...")
        # Using a fast, local zero-shot classifier
        self.classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-3")

    def clean_text(self, text: str) -> str:
        """Normalize and clean text for RAG and AI Chat."""
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'(\w)-\s+(\w)', r'\1\2', text)
        text = "".join(char for char in text if char.isprintable())
        return text.strip()

    def verify_policy_content(self, text: str) -> Dict[str, Any]:
        """Check if PDF contains policy-related content using local NLP classification."""
        # 1. Heuristic Keywords
        policy_keywords = ['policy', 'terms', 'conditions', 'refund', 'privacy', 'agreement', 'compliance', 'warranty', 'cancellation']
        academic_keywords = ['abstract', 'methodology', 'references', 'citation', 'conclusion', 'introduction', 'keywords', 'journal', 'author', 'doi']
        
        text_lower = text.lower()
        policy_found = [kw for kw in policy_keywords if kw in text_lower]
        academic_found = [kw for kw in academic_keywords if kw in text_lower]
        
        # 2. Local Zero-Shot Classification (on first 2000 chars for speed)
        sample_text = text[:2000]
        labels = ["customer support policy", "academic research paper", "commercial contract", "other"]
        classification = self.classifier(sample_text, candidate_labels=labels)
        
        top_label = classification['labels'][0]
        top_score = classification['scores'][0]
        
        # Determine validity
        is_valid = (top_label == "customer support policy" and top_score > 0.4) or (len(policy_found) >= 3 and len(academic_found) < 3)
        
        if len(academic_found) >= 5: # Strong academic marker
            is_valid = False

        # 3. Calculate Quality Score based on ambiguities (placeholder for now, will be updated in analyze)
        return {
            "is_valid": is_valid,
            "category": top_label,
            "category_score": round(top_score, 2),
            "policy_keywords": policy_found,
            "academic_markers": academic_found,
            "overall_score": round((top_score if top_label == "customer support policy" else 0) * 0.7 + (len(policy_found)/len(policy_keywords)) * 0.3, 2)
        }

    def detect_ambiguities(self, text: str) -> List[Dict[str, str]]:
        """Identify unorganized or ambiguous sections using regex word boundaries."""
        vague_map = {
            'periodically': 'at fixed intervals (e.g., monthly)',
            'occasionally': 'on a specific schedule',
            'regularly': 'every 30 days',
            'soon': 'within 5-7 business days',
            'reasonable': 'standard industry-compliant',
            'substantial': 'at least 50%',
            'at our discretion': 'according to the criteria listed in Section X',
            'may include': 'includes',
            'subject to change': 'subject to 30-day notice',
            'usually': 'consistently',
            'normally': 'as a standard procedure',
            'mostly': 'specifically',
            'approximately': 'exactly',
            'significant': 'measurable'
        }
        
        warnings = []
        # Improve sentence splitting (handles newlines and multiple spaces)
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
        
        for s in sentences:
            s_lower = s.lower()
            for vague, fix in vague_map.items():
                # Use regex with word boundaries instead of manual space checks
                # This catches the word at the start, end, or near punctuation
                if re.search(fr"\b{vague}\b", s_lower):
                    # Find exact case-insensitive match for the original text
                    match = re.search(fr"\b{vague}\b", s, re.IGNORECASE)
                    original = match.group(0) if match else vague
                    
                    warnings.append({
                        "original": original,
                        "suggestion": fix,
                        "context": (s[:100] + "...") if len(s) > 100 else s,
                        "issue": "Vague Language",
                        "severity": "High"
                    })
            
            if len(s.split()) > 45:
                warnings.append({
                    "original": s[:50] + "...",
                    "suggestion": "Break into two sentences.",
                    "context": s[:100] + "...",
                    "issue": "Complex/Long Sentence",
                    "severity": "Medium"
                })
                
            if "not responsible" in s_lower or "no liability" in s_lower:
                warnings.append({
                    "original": "not responsible / no liability",
                    "suggestion": "Specify limited liability clauses clearly.",
                    "context": s[:100] + "...",
                    "issue": "Disclaimer Alert",
                    "severity": "Medium"
                })

        return warnings[:15] # Limit for UI clarity

    async def analyze(self, pdf_file):
        """Analyze PDF for validity and ambiguities WITHOUT storing in Pinecone."""
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = await pdf_file.read()
                tmp.write(content)
                temp_path = tmp.name
            
            # Extraction
            reader = PdfReader(temp_path)
            raw_text = "\n".join(p.extract_text() for p in reader.pages if p.extract_text())
            
            # DEBUG PRINT: Verify extracted text in logs
            print(f"\n--- EXTRACTED PDF TEXT ({len(raw_text)} chars) ---")
            print(raw_text[:800])
            print("--- END EXTRACTED TEXT ---\n")
            
            if not raw_text.strip():
                 return {"status": "error", "message": "PDF appears to be empty or unreadable."}

            # Cleaning & Verification
            cleaned = self.clean_text(raw_text)
            verif = self.verify_policy_content(cleaned)
            
            # Ambiguity Analysis
            ambiguities = self.detect_ambiguities(cleaned)
            
            # Quality Scoring
            critical_count = len([a for a in ambiguities if a.get('severity') == 'High'])
            quality_score = max(0, 100 - (critical_count * 15) - (len(ambiguities) * 5))
            is_embeddable = quality_score >= 60

            return {
                "status": "success" if (verif["is_valid"] and is_embeddable) else "warning" if verif["is_valid"] else "error",
                "is_valid": verif["is_valid"],
                "is_embeddable": is_embeddable,
                "quality_score": quality_score,
                "analysis": {
                    "policy_verified": verif["is_valid"],
                    "category": verif["category"],
                    "score": verif["overall_score"],
                    "quality_score": quality_score,
                    "ambiguities_found": len(ambiguities),
                    "suggestions": ambiguities,
                    "details": verif
                },
                "raw_text": cleaned # Return cleaned text for later processing if needed
            }
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    async def process_and_store(self, text: str, org_id: str, filename: str):
        """Standardize, embed, and store text in Pinecone."""
        try:
            # Local Embedding
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.create_documents([text])
            texts = [c.page_content for c in chunks]
            embeddings = self.model.encode(texts).tolist()
            
            # Pinecone Storage (Namespace isolated)
            vectors = []
            for i, (txt, emb) in enumerate(zip(texts, embeddings)):
                vectors.append({
                    "id": f"{org_id}_{filename}_{i}",
                    "values": emb,
                    "metadata": {"text": txt, "org_id": org_id, "filename": filename}
                })
            
            namespace = f"org_{org_id}"
            self.index.upsert(vectors=vectors, namespace=namespace)
            
            return {
                "status": "success",
                "processed_chunks": len(texts),
                "namespace": namespace
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def analyze_and_process(self, pdf_file, org_id: str):
        """Legacy wrapper for backward compatibility or direct full flow."""
        analysis_res = await self.analyze(pdf_file)
        if analysis_res["status"] == "error":
            return analysis_res
        
        storage_res = await self.process_and_store(
            analysis_res["raw_text"], 
            org_id, 
            pdf_file.filename
        )
        
        analysis_res.update(storage_res)
        return analysis_res
