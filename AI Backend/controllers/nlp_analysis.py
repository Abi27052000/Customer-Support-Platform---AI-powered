import os
import re
import math
import json
import tempfile
from typing import List, Dict, Any, Tuple
from collections import Counter

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS & CONFIG
# ─────────────────────────────────────────────────────────────────────────────

# High-risk legal terms and their safer alternatives
RED_FLAGS = [
    (r"sole discretion", "mutual agreement", "Unfairness risk; replaced with 'mutual agreement' to ensure bilateral consent."),
    (r"without notice", "with 30 days written notice", "Consumer protection risk; added a mandatory notice period."),
    (r"unlimited liability", "limited to the total fees paid", "High legal exposure; added a liability cap for safety."),
    (r"non-refundable under any circumstance", "refundable as per local consumer laws", "Regulatory risk; ensuring compliance with mandatory refund laws."),
    (r"waive all rights", "waive specific rights to the extent permitted by law", "High legal risk; narrowed the waiver to be legally enforceable."),
    (r"indemnify and hold harmless", "mutually indemnify and hold harmless", "Standard but high-risk; ensured mutual indemnification."),
    (r"at any time", "with reasonable notice", "Vague; added a 'reasonable notice' requirement for fairness."),
]

# Vague phrases that need clarification and direct replacements
AMBIGUITY_PATTERNS = [
    (r"as soon as possible", "within 24 hours", "Too vague. Replaced with a specific timeframe."),
    (r"reasonable time", "within 14 business days", "Subjective. Defined a clear period."),
    (r"regularly updated", "updated monthly", "Ambiguous frequency. Set to monthly frequency."),
    (r"timely manner", "within 48 hours", "Vague. Added a specific deadline."),
    (r"at our discretion", "subject to mutual agreement", "Unilateral power. Changed to mutual agreement."),
    (r"subject to change", "subject to 30 days notice", "Lacks notice. Added a 30-day notice requirement."),
]

# ─────────────────────────────────────────────────────────────────────────────
# MAIN CONTROLLER
# ─────────────────────────────────────────────────────────────────────────────

class LocalNLPAnalysisController:
    def __init__(self):
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "quickstart")
        self.pinecone_host = os.getenv("PINECONE_HOST")
        
        print("Loading local NLP models...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-3")
        
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index = self.pc.Index(name=self.pinecone_index_name, host=self.pinecone_host)

    def clean_text(self, text: str) -> str:
        # Standardize spaces but keep word separation
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text) # Split CamelCase if any
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def detect_ambiguities(self, text: str) -> List[Dict]:
        issues = []
        text_lower = text.lower()
        
        # Check for vague phrases
        for pattern, replacement, explanation in AMBIGUITY_PATTERNS:
            flex_pattern = pattern.replace(" ", r"\s*")
            matches = re.finditer(flex_pattern, text_lower)
            for m in matches:
                issues.append({
                    "original": text[m.start():m.end()],
                    "suggestion": replacement,
                    "explanation": explanation,
                    "issue": "Vague Language",
                    "severity": "Medium",
                    "start": m.start(),
                    "end": m.end()
                })
        
        # Check for inconsistent terminology
        if "customer" in text_lower and "client" in text_lower:
            issues.append({
                "original": "Customer / Client",
                "suggestion": "Customer",
                "explanation": "Use 'Customer' consistently throughout the document.",
                "issue": "Inconsistent Terminology",
                "severity": "Low"
            })
            
        return issues

    def detect_red_flags(self, text: str) -> List[Dict]:
        flags_found = []
        text_lower = text.lower()
        for phrase_pattern, replacement, explanation in RED_FLAGS:
            flex_phrase = phrase_pattern.replace(" ", r"\s*")
            matches = re.finditer(flex_phrase, text_lower)
            for m in matches:
                flags_found.append({
                    "original": text[m.start():m.end()],
                    "suggestion": replacement,
                    "explanation": explanation,
                    "issue": "Critical Risk",
                    "severity": "High",
                    "start": m.start(),
                    "end": m.end()
                })
        return flags_found

    def generate_heatmap(self, text: str) -> List[Dict]:
        """
        Generates a word-level heatmap by interleaving plain text and issue segments.
        """
        all_issues = []
        text_lower = text.lower()
        
        # Get all issue spans
        for pattern, replacement, explanation in AMBIGUITY_PATTERNS:
            flex_pattern = pattern.replace(" ", r"\s*")
            for m in re.finditer(flex_pattern, text_lower):
                all_issues.append((m.start(), m.end(), "Medium"))
        
        for phrase_pattern, replacement, explanation in RED_FLAGS:
            flex_phrase = phrase_pattern.replace(" ", r"\s*")
            for m in re.finditer(flex_phrase, text_lower):
                all_issues.append((m.start(), m.end(), "High"))
        
        # Sort issues by start position
        all_issues.sort()
        
        heatmap = []
        last_idx = 0
        
        for start, end, risk in all_issues:
            if start < last_idx: continue # Skip overlapping
            
            # Add plain text before the issue
            if start > last_idx:
                heatmap.append({
                    "text": text[last_idx:start],
                    "risk_level": "None"
                })
            
            # Add the issue itself
            heatmap.append({
                "text": text[start:end],
                "risk_level": risk
            })
            last_idx = end
            
        # Add remaining text
        if last_idx < len(text):
            heatmap.append({
                "text": text[last_idx:],
                "risk_level": "None"
            })
            
        return heatmap

    async def analyze(self, pdf_file) -> Dict[str, Any]:
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = await pdf_file.read()
                tmp.write(content)
                temp_path = tmp.name

            reader = PdfReader(temp_path)
            # Better extraction that forces spaces
            extracted_pages = []
            for page in reader.pages:
                txt = page.extract_text() or ""
                # Heuristic: if spaces are missing, try to add them
                if " " not in txt and len(txt) > 20:
                    txt = re.sub(r'([a-z])([A-Z])', r'\1 \2', txt)
                extracted_pages.append(txt)
            
            raw_text = "\n".join(extracted_pages)
            cleaned = self.clean_text(raw_text)

            # 1. Run Detectors
            red_flags = self.detect_red_flags(cleaned)
            ambiguities = self.detect_ambiguities(cleaned)
            heatmap = self.generate_heatmap(cleaned)
            
            # 2. Validation
            labels = ["Customer Policy", "Other"]
            zs_result = self.classifier(cleaned[:1500], candidate_labels=labels)
            
            # 3. Score
            base_score = 100
            base_score -= len(red_flags) * 15
            base_score -= len(ambiguities) * 8
            quality_score = max(0, min(100, base_score))

            return {
                "status": "success",
                "quality_score": quality_score,
                "review_studio_data": {
                    "red_flags": red_flags,
                    "heatmap": heatmap,
                },
                "analysis": {
                    "suggestions": red_flags + ambiguities, # Both Red Flags and Ambiguities are now actionable
                    "score": quality_score
                },
                "raw_text": cleaned,
                "meta": {
                    "doc_type": zs_result["labels"][0],
                    "confidence": round(zs_result["scores"][0], 2)
                }
            }
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    async def process_and_store(self, text: str, org_id: str, filename: str):
        try:
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.create_documents([text])
            texts = [c.page_content for c in chunks]
            embeddings = self.embedding_model.encode(texts).tolist()
            
            vectors = []
            for i, (txt, emb) in enumerate(zip(texts, embeddings)):
                vectors.append({
                    "id": f"{org_id}_{filename}_{i}",
                    "values": emb,
                    "metadata": {"text": txt, "org_id": org_id, "filename": filename}
                })
            
            namespace = f"org_{org_id}"
            self.index.upsert(vectors=vectors, namespace=namespace)
            return {"status": "success", "processed_chunks": len(texts)}
        except Exception as e:
            return {"status": "error", "message": str(e)}
