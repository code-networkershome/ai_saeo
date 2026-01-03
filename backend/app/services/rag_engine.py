"""
RAG Engine Service
Handles semantic embeddings via Hugging Face Inference API and vector search in Supabase
"""

import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.database import get_supabase

logger = logging.getLogger(__name__)

# Recommended Hugging Face router endpoint for feature extraction
HF_API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"

class RAGEngineService:
    """Service for Retrieval-Augmented Generation using Hugging Face and Supabase"""
    
    def __init__(self):
        self.hf_token = getattr(settings, "HUGGINGFACE_API_KEY", None)
        self.headers = {"Authorization": f"Bearer {self.hf_token}"} if self.hf_token else {}

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for a text string using Hugging Face Inference API"""
        if not text:
            return []

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    HF_API_URL,
                    headers=self.headers,
                    json={"inputs": text, "options": {"wait_for_model": True}}
                )
                
                if response.status_code == 200:
                    embedding = response.json()
                    # HF returns a list of floats for a single string input in this pipeline
                    if isinstance(embedding, list) and len(embedding) > 0:
                        # If batch, it might be [[...]], for single it's [...]
                        if isinstance(embedding[0], list):
                            return embedding[0]
                        return embedding
                    return []
                
                logger.error(f"Hugging Face API error: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            logger.error(f"Failed to get embedding: {e}")
            return []

    async def store_knowledge(self, name: str, facts: Dict[str, Any], entity_type: str = "Insight"):
        """Store an entity with its embedding in the knowledge_entities table"""
        supabase = get_supabase()
        if not supabase:
            return None

        # Create search text from facts and name
        # We prioritize name, type, and key metrics in the search text
        facts_summary = f"Type: {entity_type}, Facts: {str(facts)}"
        search_text = f"{name}: {facts_summary}"
        embedding = await self.get_embedding(search_text)

        data = {
            "name": name,
            "type": entity_type,
            "facts": facts,
            "embedding": embedding if embedding else None
        }

        try:
            # Check if entity already exists
            existing = supabase.table("knowledge_entities").select("id").eq("name", name).execute()
            
            if existing.data:
                result = supabase.table("knowledge_entities").update(data).eq("name", name).execute()
            else:
                result = supabase.table("knowledge_entities").insert(data).execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error storing knowledge: {e}")
            return None

    async def query_knowledge(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Perform semantic search for relevant knowledge"""
        supabase = get_supabase()
        if not supabase:
            return []

        embedding = await self.get_embedding(query)
        if not embedding or len(embedding) == 0:
            return []

        try:
            # We use an RPC call for vector similarity search
            result = supabase.rpc(
                "match_entities", 
                {
                    "query_embedding": embedding,
                    "match_threshold": 0.5,
                    "match_count": limit
                }
            ).execute()
            
            return result.data or []
        except Exception as e:
            logger.warn(f"Vector search failed (RPC 'match_entities' might be missing): {e}")
            # Fallback to basic keyword search if RPC fails
            result = supabase.table("knowledge_entities").select("*").ilike("name", f"%{query}%").limit(limit).execute()
            return result.data or []

rag_engine = RAGEngineService()
